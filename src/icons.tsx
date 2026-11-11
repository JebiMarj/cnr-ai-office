const paths: Record<string, string> = {
  office: 'M12 2 3 7v10l9 5 9-5V7l-9-5Zm0 0v10m0 0 9-5m-9 5-9-5',
  chat: 'M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z',
  inbox: 'M3 13h5l2 3h4l2-3h5M5 5h14l2 8v6H3v-6l2-8Z',
  team: 'M16 19v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1M9 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm13 9v-1a4 4 0 0 0-3-3.8M16 4.2a3 3 0 0 1 0 5.6',
  board: 'M4 4h5v16H4zM10 4h5v10h-5zM16 4h4v7h-4z',
  reports: 'M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8l-5-5Zm0 0v5h5M8 13h8M8 17h5',
  usage: 'M12 13l4-4M4.5 18a9 9 0 1 1 15 0',
  settings: 'M4 7h10M18 7h2M4 17h4M12 17h8M14 5v4M8 15v4',
  send: 'M22 2 11 13M22 2l-7 20-4-9-9-4 20-7Z',
  pause: 'M8 5v14M16 5v14',
  play: 'M7 5l12 7-12 7V5Z',
  check: 'M5 12l5 5L20 7',
  hold: 'M9 5v14M15 5v14',
  back: 'M9 14 4 9l5-5M4 9h11a5 5 0 0 1 0 10h-3',
  instruct: 'M22 2 11 13M22 2l-7 20-4-9-9-4 20-7Z',
  attach: 'M21 11l-8.5 8.5a5 5 0 0 1-7-7L14 4a3.5 3.5 0 0 1 5 5l-8.5 8.5a2 2 0 0 1-3-3L15 7',
  core: 'M12 3v3M12 18v3M3 12h3M18 12h3M12 12m-6.5 0a6.5 6.5 0 1 0 13 0a6.5 6.5 0 1 0 -13 0M12 12m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0',
}
export function Icon({ name, size = 18 }: { name: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={paths[name]} />
    </svg>
  )
}
