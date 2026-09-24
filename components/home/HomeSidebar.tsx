import { Topic } from "@/lib/math-generator";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calculator, Hash, LayoutGrid, Percent, Divide } from "lucide-react";

interface HomeSidebarProps {
  activeTopic: Topic | 'all';
  setActiveTopic: (topic: Topic | 'all') => void;
  onCloseMobileMenu?: () => void;
}

const CATEGORIES: { id: Topic | 'all', label: string, icon: any }[] = [
  { id: 'all', label: '全部题型', icon: LayoutGrid },
  { id: 'add-sub', label: '加法与减法', icon: Calculator },
  { id: 'mul-div', label: '乘法与除法', icon: Divide },
  { id: 'fraction-decimal', label: '小数与分数', icon: Percent },
  { id: 'number-sense', label: '数感与逻辑', icon: Hash },
  { id: 'percent', label: '百分数', icon: Percent },
];

export function HomeSidebar({ activeTopic, setActiveTopic, onCloseMobileMenu }: HomeSidebarProps) {
  
  const handleSelect = (topic: Topic | 'all') => {
    setActiveTopic(topic);
    if (onCloseMobileMenu) {
      onCloseMobileMenu();
    }
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
          <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
            <Calculator className="h-5 w-5" />
          </div>
          <span className="font-bold text-lg text-slate-800 dark:text-slate-100">MathGen</span>
      </div>
      <ScrollArea className="flex-1 py-4 h-full">
          <div className="px-3 space-y-1">
            <div className="pt-2 pb-2 px-2 text-xs font-semibold text-slate-500 uppercase">分类浏览</div>
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              return (
                <Button 
                  key={cat.id}
                  variant={activeTopic === cat.id ? "secondary" : "ghost"} 
                  className="w-full justify-start" 
                  onClick={() => handleSelect(cat.id)}
                >
                  <Icon className="mr-2 h-4 w-4" /> {cat.label}
                </Button>
              );
            })}
          </div>
        </ScrollArea>
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400 text-center">
           v1.3.0 &copy; 2026
        </div>
    </div>
  );
}
