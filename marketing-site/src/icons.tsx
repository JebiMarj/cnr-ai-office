type IconName =
  | 'ea'
  | 'coach'
  | 'writer'
  | 'planner'
  | 'calls'
  | 'travel'
  | 'comp'
  | 'admin'
  | 'chat'
  | 'crm'
  | 'bolt'
  | 'mail'
  | 'check'
  | 'mic';

const paths: Record<IconName, string> = {
  ea: 'M12 12a3.2 3.2 0 1 0-3.2-3.2A3.2 3.2 0 0 0 12 12Zm-6.2 7.2a6.2 6.2 0 0 1 12.4 0',
  coach: 'M5 6.5h14v9H8l-3 2.5Z',
  writer: 'M5 19.5 6.2 15 16.5 4.7a1.6 1.6 0 0 1 2.3 2.3L8.5 17.3Z',
  planner: 'M7 4.5v2M17 4.5v2M5 8.5h14V19a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1Z',
  calls: 'M4 12h2.2l1.6-4 2.4 8 2.2-5 1.5 3H20',
  travel: 'M12 21s6-5.2 6-10a6 6 0 0 0-12 0c0 4.8 6 10 6 10Zm0-7.2a2.2 2.2 0 1 0-2.2-2.2A2.2 2.2 0 0 0 12 13.8Z',
  comp: 'M5 19h14M7 16l3-8 2 4 2-6 3 10',
  admin: 'M5 5h6v6H5Zm8 0h6v6h-6ZM5 13h6v6H5Zm8 0h6v6h-6Z',
  chat: 'M5 6h14v9H9l-4 3Z',
  crm: 'M4 7h6v12H4Zm10-3h6v15h-6Z',
  bolt: 'M13 3 6 13h5l-1 8 8-12h-5Z',
  mail: 'M4 7h16v10H4Zm0 0 8 6 8-6',
  check: 'M5 12.5 9.2 17 19 7',
  mic: 'M12 4a2.4 2.4 0 0 1 2.4 2.4V12a2.4 2.4 0 0 1-4.8 0V6.4A2.4 2.4 0 0 1 12 4ZM7 11.5a5 5 0 0 0 10 0M12 16.5V20',
};

export function Icon({ name }: { name: IconName }) {
  return (
    <svg className="ico" viewBox="0 0 24 24" aria-hidden="true">
      <path d={paths[name]} />
    </svg>
  );
}
