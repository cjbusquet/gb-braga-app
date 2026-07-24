interface PortalPageHeaderProps {
  title: string;
  description: string;
  trailing?: React.ReactNode;
}

export default function PortalPageHeader({
  title,
  description,
  trailing,
}: PortalPageHeaderProps) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div
        style={{
          color: 'var(--text-muted)',
          fontSize: 10.5,
          letterSpacing: '1px',
          textTransform: 'uppercase',
          marginBottom: 3,
        }}
      >
        Aluno
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <h1 style={{ color: 'var(--text-primary)', fontSize: 20, margin: 0 }}>
          {title}
        </h1>
        {trailing}
      </div>
      <p
        style={{
          color: 'var(--text-muted)',
          fontSize: 13,
          margin: '4px 0 0',
        }}
      >
        {description}
      </p>
    </div>
  );
}
