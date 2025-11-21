// 文件路径: src/App.tsx

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import PublicVerification from './components/PublicVerification';
import ManufacturerPortal from './components/ManufacturerPortal';
import RetailerPortal from './components/RetailerPortal';
import ServiceCenterPortal from './components/ServiceCenterPortal';
import CustomerPortal from './components/CustomerPortal';
import RoleManager from './components/RoleManager';
import { Shield, Package, Store, Wrench, User, UserCog, Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from './components/ui/sheet';
import { Button } from './components/ui/button';

export default function App() {
  const [activeTab, setActiveTab] = useState('public');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // 侧边栏导航项配置
  const navItems = [
    { value: 'public', label: 'Verify Product', icon: Shield, color: 'text-blue-600' },
    { value: 'manufacturer', label: 'Manufacturer', icon: Package, color: 'text-indigo-600' },
    { value: 'retailer', label: 'Retailer', icon: Store, color: 'text-purple-600' },
    { value: 'service', label: 'Service Center', icon: Wrench, color: 'text-emerald-600' },
    { value: 'customer', label: 'Customer', icon: User, color: 'text-cyan-600' },
    { value: 'roles', label: 'Role Management', icon: UserCog, color: 'text-slate-600' },
  ];

  // 移动端菜单点击处理
  const handleMobileNavClick = (value: string) => {
    setActiveTab(value);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-foreground flex flex-col md:flex-row">
      
      {/* ==================================================================
          1. 桌面端侧边栏 (Desktop Sidebar) - 仅在 md 以上显示
         ================================================================== */}
      <aside className="hidden md:flex w-64 flex-col border-r border-slate-200 bg-white h-screen sticky top-0 z-30 shadow-sm">
        {/* Logo Area */}
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-2 rounded-lg shadow-md">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-slate-900 font-bold text-lg leading-tight">Provenance</h1>
              <p className="text-slate-500 text-xs font-medium">dApp System</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-6 px-4">
          {/* 我们在这里不直接用 TabsList，因为 TabsList 默认样式可能很难覆盖成我们想要的垂直列表
              我们可以用普通的按钮来控制 Tabs 的 value，或者巧妙地使用 TabsList 的 class 
          */}
          <Tabs value={activeTab} onValueChange={setActiveTab} orientation="vertical" className="h-full">
             <TabsList className="flex flex-col h-auto bg-transparent space-y-1 p-0 w-full items-stretch">
                {navItems.map((item) => (
                  <TabsTrigger
                    key={item.value}
                    value={item.value}
                    className="group flex items-center justify-start gap-3 px-4 py-3 text-sm font-medium text-slate-600 rounded-lg transition-all duration-200 
                    hover:bg-slate-50 hover:text-slate-900 
                    data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-none
                    data-[state=active]:border-l-4 data-[state=active]:border-blue-600 data-[state=active]:rounded-l-none"
                  >
                    <item.icon className={`w-5 h-5 ${item.color} group-data-[state=active]:text-blue-700 transition-colors`} />
                    <span>{item.label}</span>
                  </TabsTrigger>
                ))}
             </TabsList>
          </Tabs>
        </div>

        {/* Footer Info */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span>System Operational</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">v1.0.0 • Powered by Ethereum</p>
        </div>
      </aside>


      {/* ==================================================================
          2. 移动端顶部栏 (Mobile Header) - 仅在 md 以下显示
         ================================================================== */}
      <header className="md:hidden bg-white border-b border-slate-200 p-4 sticky top-0 z-50 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-1.5 rounded-lg">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-slate-900">Provenance dApp</span>
        </div>

        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="w-6 h-6 text-slate-700" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px] sm:w-[350px] p-0">
             <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                <h2 className="font-bold text-lg">Menu</h2>
             </div>
             <div className="p-4 flex flex-col gap-1">
                {navItems.map((item) => (
                  <Button
                    key={item.value}
                    variant={activeTab === item.value ? "secondary" : "ghost"}
                    className={`justify-start gap-3 h-12 ${activeTab === item.value ? "bg-blue-50 text-blue-700" : ""}`}
                    onClick={() => handleMobileNavClick(item.value)}
                  >
                    <item.icon className={`w-5 h-5 ${item.color}`} />
                    {item.label}
                  </Button>
                ))}
             </div>
          </SheetContent>
        </Sheet>
      </header>


      {/* ==================================================================
          3. 主内容区域 (Main Content)
         ================================================================== */}
      <main className="flex-1 h-[calc(100vh-60px)] md:h-screen overflow-y-auto bg-slate-50/30">
        {/* 使用 Tabs 来控制显示内容，但这是为了配合上面的状态，实际上这里只渲染 Content */}
        <Tabs value={activeTab} className="w-full min-h-full flex flex-col">
            <div className="flex-1 p-4 md:p-8 lg:p-10 max-w-7xl mx-auto w-full">
                {/* 页面标题 - 仅在桌面显示，增加层次感 */}
                <div className="hidden md:block mb-8">
                  <h2 className="text-2xl font-bold text-slate-800">
                    {navItems.find(i => i.value === activeTab)?.label}
                  </h2>
                  <p className="text-slate-500">Manage your blockchain product lifecycle</p>
                </div>

                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
                  <TabsContent value="public" className="mt-0 focus-visible:outline-none">
                    <PublicVerification />
                  </TabsContent>

                  <TabsContent value="manufacturer" className="mt-0 focus-visible:outline-none">
                    <ManufacturerPortal />
                  </TabsContent>

                  <TabsContent value="retailer" className="mt-0 focus-visible:outline-none">
                    <RetailerPortal />
                  </TabsContent>

                  <TabsContent value="service" className="mt-0 focus-visible:outline-none">
                    <ServiceCenterPortal />
                  </TabsContent>

                  <TabsContent value="customer" className="mt-0 focus-visible:outline-none">
                    <CustomerPortal />
                  </TabsContent>

                  <TabsContent value="roles" className="mt-0 focus-visible:outline-none">
                    <RoleManager />
                  </TabsContent>
                </div>
            </div>
            
            {/* Mobile Footer Space */}
            <div className="h-10 md:hidden"></div>
        </Tabs>
      </main>

    </div>
  );
}