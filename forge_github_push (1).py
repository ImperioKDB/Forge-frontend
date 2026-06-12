#!/usr/bin/env python3
"""
FORGE — GitHub Push Utility for Google Colab
==============================================
Replicates the Forge backend's GitHub push behavior using PAT.

Features:
  - Create branch agent/{session_id} from default
  - Push file content with commit
  - Handle SHA conflicts (retry once)
  - Return { branch, github_url } matching Forge API contract
  - Secure PAT input (getpass)
  - Rate limit handling

Usage in Colab:
  1. Run setup cell
  2. Call push_to_github(pat, repo_url, file_path, content, session_id, instruction)
  3. Get back { ok, branch, github_url }
"""

import base64
import time
from urllib.parse import urlparse
import requests
from getpass import getpass

class ForgeGitHubError(Exception):
    """Custom error matching Forge API error codes"""
    def __init__(self, message, code=None, status_code=None):
        self.message = message
        self.code = code
        self.status_code = status_code
        super().__init__(f"[{code}] {message}" if code else message)

class ForgeGitHubPusher:
    """
    Replicates Forge backend GitHub integration.

    Branch naming: agent/{session_id}
    Commit message: agent: {instruction[:72]}
    """

    def __init__(self, pat):
        self.pat = pat
        self.session = requests.Session()
        self.session.headers.update({
            'Authorization': f'token {pat}',
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'Forge-Colab-Push/1.0'
        })

    def _parse_repo(self, repo_url):
        """Extract owner/repo from https://github.com/owner/repo"""
        parsed = urlparse(repo_url)
        path = parsed.path.strip('/')
        parts = path.split('/')
        if len(parts) < 2:
            raise ForgeGitHubError('Invalid GitHub URL. Expected: https://github.com/owner/repo', 'INVALID_URL')
        return parts[0], parts[1]

    def _request(self, method, endpoint, **kwargs):
        """Make authenticated request with rate limit handling"""
        url = f'https://api.github.com{endpoint}'

        # Check rate limit before request
        if hasattr(self, '_rate_limit_reset') and time.time() < self._rate_limit_reset:
            wait = int(self._rate_limit_reset - time.time())
            raise ForgeGitHubError(
                f'Rate limited. Retry after {wait}s',
                'RATE_LIMIT',
                429
            )

        response = self.session.request(method, url, **kwargs)

        # Update rate limit tracking
        if 'X-RateLimit-Remaining' in response.headers:
            remaining = int(response.headers['X-RateLimit-Remaining'])
            if remaining < 5:
                reset_at = int(response.headers.get('X-RateLimit-Reset', 0))
                self._rate_limit_reset = reset_at
                print(f"⚠️  GitHub API rate limit low: {remaining} remaining")

        if response.status_code == 429:
            retry_after = int(response.headers.get('Retry-After', 60))
            raise ForgeGitHubError(
                f'Rate limited. Retry after {retry_after}s',
                'RATE_LIMIT',
                429
            )

        if response.status_code == 401:
            raise ForgeGitHubError('Invalid GitHub PAT or insufficient permissions', 'UNAUTHORIZED', 401)

        if response.status_code == 404:
            raise ForgeGitHubError('Repository or file not found', 'NOT_FOUND', 404)

        if response.status_code == 409:
            raise ForgeGitHubError('Conflict: file modified on GitHub', 'CONFLICT', 409)

        if not response.ok:
            try:
                data = response.json()
                msg = data.get('message', 'Unknown GitHub API error')
            except:
                msg = response.text[:200]
            raise ForgeGitHubError(msg, 'GITHUB_ERROR', response.status_code)

        return response

    def validate_pat(self, repo_url):
        """Validate PAT can access repo. Returns repo info."""
        owner, repo = self._parse_repo(repo_url)
        response = self._request('GET', f'/repos/{owner}/{repo}')
        data = response.json()

        # Check scopes
        scopes = response.headers.get('X-OAuth-Scopes', '')
        if 'repo' not in scopes and 'public_repo' not in scopes:
            raise ForgeGitHubError(
                'PAT missing "repo" scope. Create at github.com/settings/tokens',
                'INVALID_PAT'
            )

        return {
            'owner': owner,
            'repo': repo,
            'default_branch': data['default_branch'],
            'permissions': data['permissions'],
        }

    def get_default_branch_sha(self, owner, repo, branch):
        """Get SHA of latest commit on branch"""
        response = self._request('GET', f'/repos/{owner}/{repo}/git/ref/heads/{branch}')
        return response.json()['object']['sha']

    def create_branch(self, owner, repo, session_id, from_branch):
        """Create agent/{session_id} branch from default"""
        branch_name = f'agent/{session_id}'

        # Check if branch already exists
        try:
            self._request('GET', f'/repos/{owner}/{repo}/git/ref/heads/{branch_name}')
            print(f"ℹ️  Branch {branch_name} already exists")
            return branch_name
        except ForgeGitHubError as e:
            if e.status_code != 404:
                raise

        # Create from default branch
        base_sha = self.get_default_branch_sha(owner, repo, from_branch)

        self._request('POST', f'/repos/{owner}/{repo}/git/refs', json={
            'ref': f'refs/heads/{branch_name}',
            'sha': base_sha
        })

        print(f"✅ Created branch: {branch_name}")
        return branch_name

    def get_file_sha(self, owner, repo, path, branch):
        """Get SHA of existing file, or None if new file"""
        try:
            response = self._request(
                'GET',
                f'/repos/{owner}/{repo}/contents/{path}',
                params={'ref': branch}
            )
            return response.json()['sha']
        except ForgeGitHubError as e:
            if e.status_code == 404:
                return None
            raise

    def push_file(self, owner, repo, file_path, content, branch, instruction, retry_on_conflict=True):
        """Push file to branch. Returns github_url."""

        # Encode content
        encoded = base64.b64encode(content.encode('utf-8')).decode('utf-8')

        # Truncate instruction to 72 chars for commit message
        msg = f"agent: {instruction[:72]}"

        # Get existing SHA
        sha = self.get_file_sha(owner, repo, file_path, branch)

        payload = {
            'message': msg,
            'content': encoded,
            'branch': branch,
        }
        if sha:
            payload['sha'] = sha

        try:
            response = self._request(
                'PUT',
                f'/repos/{owner}/{repo}/contents/{file_path}',
                json=payload
            )
        except ForgeGitHubError as e:
            if e.status_code == 409 and retry_on_conflict:
                # File modified on GitHub — fetch latest SHA and retry once
                print("⚠️  SHA conflict detected. Fetching latest SHA...")
                time.sleep(1)
                new_sha = self.get_file_sha(owner, repo, file_path, branch)
                if new_sha and new_sha != sha:
                    payload['sha'] = new_sha
                    response = self._request(
                        'PUT',
                        f'/repos/{owner}/{repo}/contents/{file_path}',
                        json=payload
                    )
                else:
                    raise ForgeGitHubError(
                        'File was modified on GitHub. Please refresh and retry.',
                        'CONFLICT',
                        409
                    )
            else:
                raise

        data = response.json()
        github_url = data['content']['html_url']

        return {
            'branch': branch,
            'github_url': github_url,
            'commit_sha': data['commit']['sha'],
        }

    def push(self, repo_url, file_path, content, session_id, instruction):
        """
        Full push flow matching Forge API contract.

        Returns: { ok: true, branch, github_url }
        """
        # Validate
        repo_info = self.validate_pat(repo_url)
        owner, repo = repo_info['owner'], repo_info['repo']
        default_branch = repo_info['default_branch']

        # Create branch
        branch = self.create_branch(owner, repo, session_id, default_branch)

        # Push file
        result = self.push_file(owner, repo, file_path, content, branch, instruction)

        return {
            'ok': True,
            'branch': result['branch'],
            'github_url': result['github_url'],
        }


# ─── Colab Convenience Functions ────────────────────────────────

def setup_pusher():
    """Interactive setup for Colab — prompts for PAT securely"""
    print("🔐 Enter your GitHub Personal Access Token (input hidden):")
    print("   Create at: https://github.com/settings/tokens")
    print("   Required scopes: repo (or public_repo for public repos)")
    pat = getpass("PAT: ")

    if not pat.startswith(('ghp_', 'github_pat_')):
        print("⚠️  Warning: PAT doesn't start with ghp_ or github_pat_")
        confirm = input("Continue anyway? (y/n): ")
        if confirm.lower() != 'y':
            return None

    return ForgeGitHubPusher(pat)


def push_to_github(pat, repo_url, file_path, content, session_id, instruction):
    """
    One-shot push function for Colab.

    Args:
        pat: GitHub Personal Access Token
        repo_url: e.g. "https://github.com/owner/repo"
        file_path: e.g. "src/app/page.tsx"
        content: File content string
        session_id: Numeric session ID (used in branch name)
        instruction: Task description (truncated to 72 chars for commit msg)

    Returns:
        { ok: true, branch: "agent/123", github_url: "..." }
    """
    pusher = ForgeGitHubPusher(pat)
    return pusher.push(repo_url, file_path, content, session_id, instruction)


def push_multiple_files(pat, repo_url, files, session_id, instruction):
    """
    Push multiple files in one session.

    Args:
        files: List of { path: "src/...", content: "..." }

    Returns:
        { ok: true, branch: "agent/123", files_pushed: [...] }
    """
    pusher = ForgeGitHubPusher(pat)
    repo_info = pusher.validate_pat(repo_url)
    owner, repo = repo_info['owner'], repo_info['repo']
    default_branch = repo_info['default_branch']

    branch = pusher.create_branch(owner, repo, session_id, default_branch)

    results = []
    for f in files:
        result = pusher.push_file(owner, repo, f['path'], f['content'], branch, instruction)
        results.append({
            'path': f['path'],
            'github_url': result['github_url'],
        })

    return {
        'ok': True,
        'branch': branch,
        'files_pushed': results,
        'pr_url': f"https://github.com/{owner}/{repo}/compare/{branch}",
    }


# ─── Example / Test ─────────────────────────────────────────────

if __name__ == '__main__':
    print("""
    ╔══════════════════════════════════════════════════════════════╗
    ║  FORGE GitHub Push Utility                                  ║
    ║  Run in Google Colab or local Python environment            ║
    ╚══════════════════════════════════════════════════════════════╝

    Quick start:
      pusher = setup_pusher()
      result = pusher.push(
          repo_url="https://github.com/yourname/yourrepo",
          file_path="src/app/page.tsx",
          content="// your code here",
          session_id=123,
          instruction="Add user authentication"
      )
      print(result)

    Or one-shot:
      result = push_to_github(pat, repo_url, file_path, content, session_id, instruction)
    """)
