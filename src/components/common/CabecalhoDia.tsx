import { formatarDia } from '../../lib/dataLocal';

/** Cabeçalho de um grupo de dia — destaca "hoje" numa lista de vários dias
 * (Agenda, Particulares) para facilitar encontrar rapidamente o dia atual. */
export default function CabecalhoDia({ iso, hojeIso }: { iso: string; hojeIso: string }) {
  const isHoje = iso === hojeIso;
  return (
    <div className="flex gap-2 items-center mb-1.5">
      <span className={[
        'text-[10.5px] font-semibold tracking-[1px] uppercase',
        isHoje ? 'text-gb-red' : 'text-muted',
      ].join(' ')}>
        {formatarDia(iso)}
      </span>
      {isHoje && (
        <span className="py-0.5 px-2 text-[9.5px] font-bold tracking-wide text-white uppercase rounded-full bg-gb-red">
          Hoje
        </span>
      )}
    </div>
  );
}
