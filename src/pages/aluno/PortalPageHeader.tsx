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
    <div className="mb-[18px]">
      <div className="mb-1 text-[10.5px] tracking-[1px] uppercase text-muted">
        Aluno
      </div>
      <div className="flex gap-2.5 items-center">
        <h1 className="m-0 text-xl text-primary">
          {title}
        </h1>
        {trailing}
      </div>
      <p className="mt-1 mb-0 text-[13px] text-muted">
        {description}
      </p>
    </div>
  );
}
