import type { ReactNode } from "react";
import { PageHeader } from "@/components/PageHeader";

interface AdminPageHeaderProps {
  title: string;
  subtitle: string;
  action?: ReactNode;
  backHref?: string;
}

export default function AdminPageHeader({ title, subtitle, action, backHref }: AdminPageHeaderProps) {
  return <PageHeader title={title} description={subtitle} actions={action} backHref={backHref} />;
}
