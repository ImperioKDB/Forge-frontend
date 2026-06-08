export default function StatusDot({ status }) {
  const config = {
    planning:          { color: 'bg-accent',   pulse: true,  label: 'Planning'     },
    coding:            { color: 'bg-info',     pulse: true,  label: 'Coding'       },
    awaiting_approval: { color: 'bg-success',  pulse: false, label: 'Ready'        },
    plan_review:       { color: 'bg-accent',   pulse: true,  label: 'Review Plan'  },
    done:              { color: 'bg-success',  pulse: false, label: 'Done'         },
    failed:            { color: 'bg-danger',   pulse: false, label: 'Failed'       },
    pending:           { color: 'bg-muted',    pulse: false, label: 'Pending'      },
  }

  const { color, pulse, label } = config[status] || config.pending

  return (
    <span
      className="inline-flex items-center gap-1.5"
      role="status"
      aria-label={`Status: ${label}`}
    >
      <span className="relative flex h-2 w-2" aria-hidden="true">
        {pulse && (
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full ${color} opacity-50`}
          />
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${color}`} />
      </span>
      <span className="text-xs text-muted">{label}</span>
    </span>
  )
}
