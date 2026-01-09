"use client";

import { Sidebar, SidebarItem, SidebarSection } from "@/components/ui/sidebar";
import { LogOut } from "lucide-react";

export interface Member {
  id: string;
  username: string;
  color: string;
  online: boolean;
}

export function PartySidebar({
  open,
  onClose,
  partyCode,
  members,
  selfId,
  onLeave,
}: {
  open: boolean;
  onClose: () => void;
  partyCode: string;
  members: Member[];
  selfId: string;
  onLeave: () => void;
}) {
  return (
    <Sidebar open={open} onClose={onClose}>
      {/* PARTY INFO */}
      <SidebarSection title="Party">
        <div className="text-white font-mono text-sm">
          Code:{" "}
          <span className="text-cyan-300">
            {partyCode || "—"}
          </span>
        </div>
      </SidebarSection>

      {/* MEMBERS */}
      <SidebarSection title="Members">
        {members.length === 0 ? (
          <p className="text-sm text-neutral-400">
            No members yet
          </p>
        ) : (
          <div className="flex flex-col gap-1">
            {members.map((m) => (
              <div
                key={m.id}
                className="flex items-center gap-2 px-2 py-1 rounded-md text-sm text-white"
              >
                {/* ONLINE DOT */}
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: m.color }}
                />

                <span className="truncate">
                  {m.username}
                  {m.id === selfId && (
                    <span className="text-neutral-400"> (You)</span>
                  )}
                </span>
              </div>
            ))}
          </div>
        )}
      </SidebarSection>

      {/* ACTIONS */}
      <div className="mt-auto pt-4">
        <SidebarItem
          danger
          onClick={() => {
            onClose();
            onLeave();
          }}
        >
          <LogOut size={16} />
          Leave Party
        </SidebarItem>
      </div>
    </Sidebar>
  );
}
