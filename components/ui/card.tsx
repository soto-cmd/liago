import * as React from "react";
import { cn } from "@/lib/utils";

export function Card(props: React.ComponentProps<"div">) {
  return <div {...props} className={cn("rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-950", props.className)} />;
}

export function CardHeader(props: React.ComponentProps<"div">) {
  return <div {...props} className={cn("p-6 pb-3", props.className)} />;
}

export function CardTitle(props: React.ComponentProps<"h2">) {
  return <h2 {...props} className={cn("text-lg font-semibold", props.className)} />;
}

export function CardDescription(props: React.ComponentProps<"p">) {
  return <p {...props} className={cn("mt-1 text-sm text-neutral-500", props.className)} />;
}

export function CardContent(props: React.ComponentProps<"div">) {
  return <div {...props} className={cn("p-6 pt-3", props.className)} />;
}
