import * as React from "react";
export const Popover = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;
export const PopoverTrigger = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ children, ...props }, ref) => (
  <div ref={ref} {...props}>{children}</div>
));
PopoverTrigger.displayName = "PopoverTrigger";
export const PopoverContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ children, ...props }, ref) => (
  <div ref={ref} {...props}>{children}</div>
));
PopoverContent.displayName = "PopoverContent"; 