// 文件路径: src/App.tsx

import { useState, useEffect } from "react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarSeparator,
  SidebarRail,
} from "./components/ui/sidebar"
import { Separator } from "./components/ui/separator"
import { Tabs, TabsContent } from "./components/ui/tabs"
import {
  Shield,
  Package,
  Store,
  Wrench,
  User,
  UserCog,
  ChevronsUpDown,
  CheckCircle2,
  Copyright,
  Wallet,
  Lock
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "./components/ui/avatar"
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuTrigger 
} from "./components/ui/dropdown-menu"
import { Button } from "./components/ui/button"
import { toast } from "sonner"

// 引入业务组件
import PublicVerification from './components/PublicVerification'
import ManufacturerPortal from './components/ManufacturerPortal'
import RetailerPortal from './components/RetailerPortal'
import ServiceCenterPortal from './components/ServiceCenterPortal'
import CustomerPortal from './components/CustomerPortal'
import RoleManager from './components/RoleManager'

// 引入服务
import { blockchainService, UserRoles } from './lib/blockchainService'
import { shortenAddress } from './lib/blockchainUtils'

const navItems = [
  { value: 'public', title: 'Verify Product', icon: Shield },
  { value: 'manufacturer', title: 'Manufacturer', icon: Package },
  { value: 'retailer', title: 'Retailer', icon: Store },
  { value: 'service', title: 'Service Center', icon: Wrench },
  { value: 'customer', title: 'Customer', icon: User },
  { value: 'roles', title: 'Role Management', icon: UserCog },
]

// 🛡️ 1. 重新找回 RoleGuard 组件
function RoleGuard({ 
  children, 
  requiredRole 
}: { 
  children: React.ReactNode, 
  requiredRole: keyof UserRoles 
}) {
  const [status, setStatus] = useState<'loading' | 'disconnected' | 'unauthorized' | 'authorized'>('loading');
  
  const checkPermission = async () => {
    setStatus('loading');
    
    // 检查连接
    if (!blockchainService.isConnected()) {
      setStatus('disconnected');
      return;
    }

    try {
      // 获取角色
      const address = blockchainService.currentAddress;
      const roles = await blockchainService.getUserRoles(address);
      
      // 验证权限 (管理员拥有所有权限)
      if (roles[requiredRole] || roles.isAdmin) {
        setStatus('authorized');
      } else {
        setStatus('unauthorized');
      }
    } catch (e) {
      console.error("Permission check failed", e);
      setStatus('disconnected');
    }
  };

  useEffect(() => {
    checkPermission();
  }, [requiredRole]);

  // 重新连接处理
  const handleConnect = async () => {
    try {
      await blockchainService.connectWallet();
      checkPermission(); // 重试
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <p className="text-slate-500 text-sm">Verifying permissions...</p>
      </div>
    );
  }

  if (status === 'disconnected') {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] max-w-md mx-auto text-center space-y-6">
        <div className="bg-slate-100 p-4 rounded-full">
          <Wallet className="w-8 h-8 text-slate-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Wallet Not Connected</h3>
          <p className="text-slate-500 mt-2">Please connect your wallet (bottom left) to verify access.</p>
        </div>
        <Button onClick={handleConnect}>Connect Wallet</Button>
      </div>
    );
  }

  if (status === 'unauthorized') {
    const roleName = requiredRole.replace('is', '').replace(/([A-Z])/g, ' $1').trim();
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] max-w-md mx-auto text-center space-y-6">
        <div className="bg-red-50 p-4 rounded-full">
          <Lock className="w-8 h-8 text-red-500" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-red-900">Access Denied</h3>
          <p className="text-red-600/80 mt-2">
            Your account does not have the <strong>{roleName}</strong> role required here.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default function App() {
  const [activeTab, setActiveTab] = useState('public')
  const currentTitle = navItems.find(item => item.value === activeTab)?.title

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-slate-50 overflow-hidden">
        <AppSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        <SidebarInset className="flex flex-col flex-1 h-full overflow-hidden transition-all duration-300 ease-in-out">
          <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-white px-4 shadow-sm z-20 sticky top-0">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <div className="flex flex-col">
               <span className="text-sm font-semibold text-slate-900">{currentTitle}</span>
               <span className="text-xs text-slate-500">Blockchain Warranty System</span>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 w-full">
             <div className="mx-auto w-full max-w-7xl space-y-6">
               <Tabs value={activeTab} className="w-full">
                 <div className="animate-in fade-in zoom-in-95 duration-300">
                    <TabsContent value="public" className="m-0 outline-none space-y-4"><PublicVerification /></TabsContent>
                    <TabsContent value="manufacturer" className="m-0 outline-none space-y-4"><RoleGuard requiredRole="isManufacturer"><ManufacturerPortal /></RoleGuard></TabsContent>
                    <TabsContent value="retailer" className="m-0 outline-none space-y-4"><RoleGuard requiredRole="isRetailer"><RetailerPortal /></RoleGuard></TabsContent>
                    <TabsContent value="service" className="m-0 outline-none space-y-4"><RoleGuard requiredRole="isServiceCenter"><ServiceCenterPortal /></RoleGuard></TabsContent>
                    <TabsContent value="customer" className="m-0 outline-none space-y-4"><CustomerPortal /></TabsContent>
                    <TabsContent value="roles" className="m-0 outline-none space-y-4"><RoleManager /></TabsContent>
                 </div>
               </Tabs>
             </div>
          </main>
          <footer className="shrink-0 border-t bg-white px-6 py-3 text-xs text-slate-500 flex items-center justify-between z-10"><div className="flex items-center gap-1"><Copyright className="w-3 h-3" /><span>2024 Product Provenance</span></div><div className="flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-green-500"></div><span>System Online</span></div></footer>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}

function AppSidebar({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (v: string) => void }) {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState('');

  useEffect(() => {
    if (blockchainService.isConnected()) {
      setIsConnected(true);
      setAddress(blockchainService.currentAddress);
    }

    // ✅ 关键：注册监听器，当 MetaMask 切换账户时自动更新
    blockchainService.onAccountChange((newAddress) => {
      if (newAddress) {
        setAddress(newAddress);
        setIsConnected(true);
        toast.success(`Switched to ${shortenAddress(newAddress)}`);
      } else {
        setAddress('');
        setIsConnected(false);
        toast.info("Wallet Disconnected");
      }
    });
  }, []);

  const handleConnectWallet = async () => {
    if (isConnected) {
      navigator.clipboard.writeText(address);
      toast.success("Address Copied");
      return;
    }
    try {
      const wallet = await blockchainService.connectWallet();
      setAddress(wallet.address);
      setIsConnected(true);
    } catch (error: any) { console.error(error); }
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-slate-200 bg-white">
      <SidebarHeader className="border-b border-slate-100/50 pb-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground hover:bg-slate-100">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-md shadow-blue-200"><Shield className="size-4" /></div>
                  <div className="grid flex-1 text-left text-sm leading-tight"><span className="truncate font-bold text-slate-900">Provenance</span><span className="truncate text-xs text-slate-500">dApp Admin</span></div>
                  <ChevronsUpDown className="ml-auto size-4 opacity-50" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg shadow-lg" align="start" side="bottom" sideOffset={4}>
                <DropdownMenuItem className="gap-2 p-2 cursor-pointer"><div className="flex size-6 items-center justify-center rounded-sm border bg-slate-50"><Shield className="size-4 shrink-0 text-blue-600" /></div><div><div className="font-medium text-slate-900">Product System</div><div className="text-xs text-slate-500">v1.0.0</div></div></DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      
      <SidebarContent className="py-2">
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Main Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="px-2 space-y-1">
              {navItems.map((item) => (
                <SidebarMenuItem key={item.value}>
                  <SidebarMenuButton 
                    isActive={activeTab === item.value} 
                    onClick={() => setActiveTab(item.value)}
                    tooltip={item.title}
                    size="default"
                    className={`h-10 transition-all duration-200 rounded-md group relative overflow-hidden ${activeTab === item.value ? "bg-blue-50 text-blue-700 font-semibold shadow-sm ring-1 ring-blue-100" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`}
                  >
                    <item.icon className={`size-4 ${activeTab === item.value ? "text-blue-600" : "text-slate-500 group-hover:text-slate-700"}`} />
                    <span>{item.title}</span>
                    {activeTab === item.value && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-600 rounded-r-full" />}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarSeparator className="mx-4 my-2 bg-slate-100" />
        <SidebarGroup>
           <SidebarGroupLabel className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</SidebarGroupLabel>
           <SidebarGroupContent><div className="px-4 py-2"><div className="flex items-center gap-2 text-xs font-medium text-emerald-700 bg-emerald-50 p-2.5 rounded-md border border-emerald-100 shadow-sm"><CheckCircle2 className="w-3.5 h-3.5" /><span>Network Operational</span></div></div></SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="border-t border-slate-100 bg-slate-50/50 p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              size="lg" 
              onClick={handleConnectWallet}
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground hover:bg-white hover:shadow-sm transition-all cursor-pointer"
              tooltip={isConnected ? "Copy Address" : "Connect Wallet"}
            >
              <Avatar className={`h-8 w-8 rounded-lg border ${isConnected ? 'border-green-200' : 'border-slate-200'}`}>
                {isConnected ? <AvatarFallback className="rounded-lg bg-green-100 text-green-700"><Wallet className="w-4 h-4" /></AvatarFallback> : <AvatarFallback className="rounded-lg bg-slate-100 text-slate-500"><User className="w-4 h-4" /></AvatarFallback>}
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold text-slate-800">{isConnected ? "My Wallet" : "Guest User"}</span>
                <span className={`truncate text-xs ${isConnected ? 'text-green-600 font-mono' : 'text-slate-500'}`}>{isConnected ? shortenAddress(address) : "Click to Connect"}</span>
              </div>
              {isConnected ? <CheckCircle2 className="ml-auto size-4 text-green-500" /> : <ChevronsUpDown className="ml-auto size-4 opacity-50" />}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}