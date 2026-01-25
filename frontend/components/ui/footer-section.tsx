"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { Instagram, Linkedin, Github, Moon, Send, Sun, Mail, MapPin, Phone } from "lucide-react"
import { GlowingEffect } from "./glowing-effect"
import { cn } from "@/lib/utils"

function Footerdemo() {
    const [isDarkMode, setIsDarkMode] = React.useState(true)

    React.useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add("dark")
        } else {
            document.documentElement.classList.remove("dark")
        }
    }, [isDarkMode])

    const handleEmailSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        const target = e.target as typeof e.target & {
            email: { value: string };
        };
        const email = target.email.value;
        window.location.href = `mailto:chaturvedisiddharth008@gmail.com?subject=Inquiry from Real-Time Tracker&body=From: ${email}`;
    }

    return (
        <footer className={cn(
            "relative border-t transition-all duration-700 overflow-hidden",
            isDarkMode
                ? "bg-black text-white border-white/10"
                : "bg-gradient-to-br from-cyan-50 to-purple-50 text-black border-black/5"
        )}>

            {/* Background Structures for Dark Mode */}
            {isDarkMode && (
                <div className="absolute inset-0 pointer-events-none opacity-30">
                    <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-cyan-900/20 rounded-full blur-[120px] animate-pulse" />
                    <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-purple-900/20 rounded-full blur-[120px] animate-pulse" />
                    <div className="absolute top-[20%] right-[10%] w-[15%] h-[15%] border border-white/5 rounded-full" />
                    <div className="absolute bottom-[30%] left-[15%] w-[25%] h-[25%] border border-white/5 rounded-full" />
                </div>
            )}

            <div className="container mx-auto px-4 py-16 md:px-6 lg:px-8 relative z-10">
                <div className="grid gap-12 lg:grid-cols-3">

                    {/* Stay Connected & Contact Integration */}
                    <div className="relative group p-[1px] rounded-2xl h-full">
                        <GlowingEffect
                            spread={40}
                            glow={true}
                            disabled={false}
                            proximity={64}
                            inactiveZone={0.01}
                            borderWidth={1.5}
                        />
                        <div className={cn(
                            "relative p-8 rounded-2xl h-full flex flex-col backdrop-blur-sm border",
                            isDarkMode ? "bg-white/5 border-white/10" : "bg-black/5 border-black/5"
                        )}>
                            <h2 className="mb-4 text-3xl font-bold tracking-tight">Stay Connected</h2>
                            <p className="mb-6 text-muted-foreground">
                                Have questions or feedback? Send an email directly to the creator.
                            </p>
                            <form onSubmit={handleEmailSubmit} className="relative mb-8">
                                <Input
                                    name="email"
                                    type="email"
                                    placeholder="Your Email"
                                    required
                                    className={cn(
                                        "pr-12",
                                        isDarkMode ? "bg-white/5 border-white/10" : "bg-white border-black/10"
                                    )}
                                />
                                <Button
                                    type="submit"
                                    size="icon"
                                    className="absolute right-1 top-1 h-8 w-8 rounded-full transition-transform hover:scale-110"
                                >
                                    <Send className="h-4 w-4" />
                                    <span className="sr-only">Send</span>
                                </Button>
                            </form>

                            <div className="mt-auto space-y-4 pt-4 border-t border-current/10">
                                <div className="flex items-center gap-3 text-sm">
                                    <Mail className="h-4 w-4 text-cyan-400" />
                                    <span>chaturvedisiddharth008@gmail.com</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Location / Info Section */}
                    <div className="relative group p-[1px] rounded-2xl h-full">
                        <GlowingEffect
                            spread={40}
                            glow={true}
                            disabled={false}
                            proximity={64}
                            inactiveZone={0.01}
                            borderWidth={1.5}
                        />
                        <div className={cn(
                            "relative p-8 rounded-2xl h-full flex flex-col backdrop-blur-sm border",
                            isDarkMode ? "bg-white/5 border-white/10" : "bg-black/5 border-black/5"
                        )}>
                            <h3 className="mb-6 text-xl font-bold uppercase tracking-widest text-muted-foreground">Contact Detail</h3>
                            <address className="space-y-4 not-italic">
                                <div className="flex items-start gap-3">
                                    <MapPin className="h-5 w-5 mt-0.5 text-purple-400" />
                                    <div>
                                        <p className="font-semibold">Innovation Hub</p>
                                        <p className="text-sm opacity-70">Tech Park, Sector 62</p>
                                        <p className="text-sm opacity-70">Tech City, INDIA</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Phone className="h-5 w-5 text-green-400" />
                                    <p className="text-sm">+91 (XXX) XXX-XXXX</p>
                                </div>
                            </address>

                            <div className="mt-12 flex items-center justify-between p-4 bg-primary/5 rounded-xl border border-primary/10">
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                    <span className="text-xs font-bold uppercase tracking-tight">Live Support Active</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Socials & Theme Toggle */}
                    <div className="relative group p-[1px] rounded-2xl h-full">
                        <GlowingEffect
                            spread={40}
                            glow={true}
                            disabled={false}
                            proximity={64}
                            inactiveZone={0.01}
                            borderWidth={1.5}
                        />
                        <div className={cn(
                            "relative p-8 rounded-2xl h-full flex flex-col backdrop-blur-sm border",
                            isDarkMode ? "bg-white/5 border-white/10" : "bg-black/5 border-black/5"
                        )}>
                            <h3 className="mb-6 text-xl font-bold uppercase tracking-widest text-muted-foreground">Follow Us</h3>
                            <div className="flex flex-wrap gap-6 mb-12">
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="rounded-full h-12 w-12 border-2 hover:scale-110 transition-transform"
                                                onClick={() => window.open("https://www.instagram.com/siddharthhhhh._/?hl=en", "_blank")}
                                            >
                                                <Instagram className="h-6 w-6" />
                                                <span className="sr-only">Instagram</span>
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Follow on Instagram</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>

                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="rounded-full h-12 w-12 border-2 hover:scale-110 transition-transform"
                                                onClick={() => window.open("https://www.linkedin.com/in/siddharth-chaturvedi-75772b250", "_blank")}
                                            >
                                                <Linkedin className="h-6 w-6" />
                                                <span className="sr-only">LinkedIn</span>
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Connect on LinkedIn</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>

                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="rounded-full h-12 w-12 border-2 hover:scale-110 transition-transform"
                                                onClick={() => window.open("https://github.com/SiddharthChaturvedii", "_blank")}
                                            >
                                                <Github className="h-6 w-6" />
                                                <span className="sr-only">GitHub</span>
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>View GitHub Projects</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>

                            <div className="mt-auto space-y-4">
                                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-2xl border border-white/5">
                                    <div className="flex items-center gap-2">
                                        {isDarkMode ? <Moon size={18} className="text-cyan-400" /> : <Sun size={18} className="text-orange-400" />}
                                        <span className="text-sm font-medium">{isDarkMode ? "Dark" : "Light"} Mode</span>
                                    </div>
                                    <Switch
                                        id="dark-mode"
                                        checked={isDarkMode}
                                        onCheckedChange={setIsDarkMode}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

                <div className="mt-16 pt-8 border-t border-current/10 flex flex-col items-center justify-between gap-6 md:flex-row">
                    <p className="text-sm text-muted-foreground">
                        © {new Date().getFullYear()} Siddharth Chaturvedi. All rights reserved.
                    </p>
                    <div className="flex gap-8 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                        <a href="#" className="hover:text-cyan-400 transition-colors">Privacy</a>
                        <a href="#" className="hover:text-purple-400 transition-colors">Terms</a>
                        <a href="#" className="hover:text-white transition-colors">Cookies</a>
                    </div>
                </div>
            </div>
        </footer>
    )
}

export { Footerdemo }
