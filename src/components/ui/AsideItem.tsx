import { cn } from "../../utils/utils";

type AsideItemProps = {
  key: string;
  isActive?: boolean;
  onClick: () => void;
  label: string;
  svg?: React.ReactNode;
}

export const AsideItem = ( props : AsideItemProps ) => {
  const { key, onClick, label, svg, isActive } = props;
  return (
    <li key={key}>
      <button
        onClick={onClick}
        className={cn("w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors cursor-pointer border border-black/0 hover:border-blue-200",
          isActive
            ? 'bg-blue-50 text-blue-700 border border-blue-200'
            : 'text-gray-700 hover:bg-gray-50'
        )}
      >
        {svg}
        <p>{label}</p>
      </button>
    </li>
  )
}