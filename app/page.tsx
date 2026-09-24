"use client";

import { useState } from "react";
import { PRESETS, presetTags, type Category } from "@/lib/presets";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calculator,
  FileText,
  ArrowRight,
  Menu,
} from "lucide-react";
import Link from "next/link";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet"; // Added SheetHeader, SheetTitle
import { HomeSidebar } from "@/components/home/HomeSidebar";

export default function Home() {
  const [activeTopic, setActiveTopic] = useState<Category | 'all'>('all');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
    // Filter presets based on active tab
    const filteredPresets = activeTopic === 'all' 
      ? PRESETS 
      : PRESETS.filter(p => p.category === activeTopic);
  
    return (
      <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden flex-col md:flex-row">
      {/* --- MOBILE HEADER --- */}
      <div className="md:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 flex items-center justify-between">
         <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
              <Calculator className="h-5 w-5" />
            </div>
            <span className="font-bold text-lg text-slate-800 dark:text-slate-100">MathGen</span>
         </div>
         <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
               <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
               </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72 overflow-hidden">
               <SheetHeader>
                  <SheetTitle className="sr-only">菜单</SheetTitle>
               </SheetHeader>
               <HomeSidebar 
                  activeTopic={activeTopic} 
                  setActiveTopic={setActiveTopic} 
                  onCloseMobileMenu={() => setIsMobileMenuOpen(false)}
               />
            </SheetContent>
         </Sheet>
      </div>

      {/* --- DESKTOP SIDEBAR --- */}
      <aside className="hidden md:flex w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex-col shrink-0 z-10">
        <HomeSidebar
           activeTopic={activeTopic}
           setActiveTopic={setActiveTopic}
        />
      </aside>

      {/* --- MAIN CONTENT AREA --- */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
           <div className="flex-1 overflow-y-auto p-4 md:p-8">
              <div className="max-w-6xl mx-auto">
                <div className="mb-6 md:mb-8">
                  <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">选择题型</h1>
                  <p className="text-slate-500 mt-2 text-sm md:text-base">选择一个预设模版开始创建数学工作表。</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                   {filteredPresets.map(preset => (
                     <Link key={preset.id} href={`/quiz/${preset.id}`} passHref>
                        <Card className="cursor-pointer hover:border-blue-500 hover:shadow-lg transition-all group h-full flex flex-col">
                            <CardHeader className="pb-4 flex-1 content-start">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="h-10 w-10 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                                        <FileText className="h-5 w-5 text-blue-600 group-hover:text-white" />
                                    </div>
                                    <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg group-hover:text-blue-600 transition-colors">{preset.name}</CardTitle>
                                    <p className="text-xs text-slate-400 mt-0.5">{preset.nameEn}</p>
                                </div>
                                <CardDescription className="line-clamp-2 mt-2 text-sm">{preset.description}</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-0 mt-auto">
                                <div className="flex flex-wrap gap-2">
                                    {presetTags(preset).map(op => (
                                    <Badge key={op} variant="secondary" className="text-[10px] uppercase">{op}</Badge>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                     </Link>
                   ))}
                </div>
              </div>
           </div>
      </main>
    </div>
  );
}