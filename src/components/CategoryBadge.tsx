import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface CategoryBadgeProps {
  category?: string | null;
  className?: string;
}

const CategoryBadge = ({ category, className }: CategoryBadgeProps) => {
  const label = (category || 'N/A').trim();
  const upper = label.toUpperCase();

  let colorClass = "bg-muted text-muted-foreground";
  if (upper.startsWith('GREEN')) colorClass = "bg-zone-green text-white";
  else if (upper.startsWith('YELLOW')) colorClass = "bg-zone-yellow text-black";
  else if (upper.startsWith('RED')) colorClass = "bg-zone-red text-white";

  return (
    <Badge variant="default" className={cn("text-xs", colorClass, className)}>
      {label}
    </Badge>
  );
};

export default CategoryBadge;