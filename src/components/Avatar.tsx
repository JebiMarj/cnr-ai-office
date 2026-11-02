type AvatarProps = {
  slug: string
  size?: 'lg' | 'md' | 'sm'
  status?: string
}

export function Avatar({ slug, size = 'md', status = 'idle' }: AvatarProps) {
  const scale = size === 'sm' ? 'small' : size === 'lg' ? 'large' : ''
  return (
    <span className={`avatar-halo ${scale}`} data-status={status} aria-hidden="true">
      <span className={`avatar ${scale}`} data-slug={slug}>
        <Glyph slug={slug} />
      </span>
    </span>
  )
}

function Glyph({ slug }: { slug: string }) {
  const common = {
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.7,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }

  switch (slug) {
    case 'jv':
      return (
        <svg viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M12 3.2 14.1 8.8l5.9.5-4.5 3.8 1.4 5.7L12 16.2 6.1 18.8l1.4-5.7L3 9.3l5.9-.5L12 3.2z"
          />
        </svg>
      )
    case 'marj':
      return (
        <svg viewBox="0 0 24 24">
          <path d="M12 4.2 18.5 7.6v4.2c0 3.6-2.6 6.4-6.5 7.6-3.9-1.2-6.5-4-6.5-7.6V7.6L12 4.2z" {...common} />
          <path d="M12 8.2v6.2M9.4 11.3h5.2" {...common} />
        </svg>
      )
    case 'alex':
      return (
        <svg viewBox="0 0 24 24">
          <rect x="7" y="4.5" width="10" height="15" rx="2" {...common} />
          <path d="M9.5 4.8h5V7h-5zM9 11h6M9 14h6M9 17h4" {...common} />
        </svg>
      )
    case 'mechanicus':
      return (
        <svg viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="3" {...common} />
          <path d="M12 3.2v2.4M12 18.4v2.4M3.2 12h2.4M18.4 12h2.4M5.8 5.8l1.7 1.7M16.5 16.5l1.7 1.7M18.2 5.8l-1.7 1.7M7.5 16.5l-1.7 1.7" {...common} />
        </svg>
      )
    case 'sage':
      return (
        <svg viewBox="0 0 24 24">
          <path d="M12 3.5 20.5 8.2 12 12.8 3.5 8.2 12 3.5zM3.5 12l8.5 4.6L20.5 12M3.5 15.6 12 20.2l8.5-4.6" {...common} />
        </svg>
      )
    case 'dev':
      return (
        <svg viewBox="0 0 24 24">
          <path d="M9 7.5 4.5 12 9 16.5M15 7.5 19.5 12 15 16.5M13 6.5l-2 11" {...common} />
        </svg>
      )
    case 'tech':
      return (
        <svg viewBox="0 0 24 24">
          <path d="M8 8h8v4H8zM10.5 12v2.2M13.5 12v2.2M8.5 16.2h7V19h-7zM12 8V5" {...common} />
        </svg>
      )
    case 'gia':
      return (
        <svg viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="2.1" {...common} />
          <path d="M12 3v3.2M12 17.8V21M3 12h3.2M17.8 12H21M6.1 6.1l2.2 2.2M15.7 15.7l2.2 2.2M17.9 6.1l-2.2 2.2M8.3 15.7l-2.2 2.2" {...common} />
        </svg>
      )
    default:
      return (
        <svg viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="6" {...common} />
        </svg>
      )
  }
}
