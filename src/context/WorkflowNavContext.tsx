"use client";

import { createContext, useContext } from "react";
import { supabase } from "@/lib/supabase";

interface WorkflowNavState {
  progress: number;
  resetSession: () => Promise<void>;
}

const defaultReset = async () => {
  await supabase.auth.signOut();
  window.location.href = "/login";
};

const WorkflowNavContext = createContext<WorkflowNavState>({
  progress: 0,
  resetSession: defaultReset,
});

export function WorkflowNavProvider({
  value,
  children,
}: {
  value: WorkflowNavState;
  children: React.ReactNode;
}) {
  return (
    <WorkflowNavContext.Provider value={value}>{children}</WorkflowNavContext.Provider>
  );
}

export function useWorkflowNav(): WorkflowNavState {
  return useContext(WorkflowNavContext);
}
