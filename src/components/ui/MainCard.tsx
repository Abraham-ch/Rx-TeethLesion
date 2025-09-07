import { cn } from "../../utils/utils";

type CardProps = {
  title: string;
  meta: string;
  svg?: React.ReactNode;  
  className?: string;
  onClick?: () => void;
}

export const MainCard = ( props : CardProps ) => {
  const { title, meta, svg, className, onClick } = props;
  return (
    <button onClick={onClick} className="cursor-pointer bg-white rounded-xl border border-gray-200 p-6 text-center">
      <div className={cn(
        "w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4",
        className
      )}>
        {svg}
      </div>
      <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600">{meta}</p>
    </button>
  )
}