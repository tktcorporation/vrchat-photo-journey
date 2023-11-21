import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import * as React from "react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const AlertDialog = AlertDialogPrimitive.Root;

const AlertDialogTrigger = AlertDialogPrimitive.Trigger;

const AlertDialogPortal = AlertDialogPrimitive.Portal;

interface AlertDialogOverlayProps
    extends React.ComponentPropsWithoutRef<
        typeof AlertDialogPrimitive.Overlay
    > {
    className?: string;
}

const AlertDialogOverlay = React.forwardRef<
    React.ElementRef<typeof AlertDialogPrimitive.Overlay>,
    AlertDialogOverlayProps
>(({ className, ...props }, ref) => (
    <AlertDialogPrimitive.Overlay
        {...props}
        className={cn(
            "fixed inset-0 z-50 bg-background/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            className,
        )}
        ref={ref}
    />
));
AlertDialogOverlay.displayName = AlertDialogPrimitive.Overlay.displayName;

interface AlertDialogContentProps
    extends React.ComponentPropsWithoutRef<
        typeof AlertDialogPrimitive.Content
    > {
    className?: string;
}

const AlertDialogContent = React.forwardRef<
    React.ElementRef<typeof AlertDialogPrimitive.Content>,
    AlertDialogContentProps
>(({ className, ...props }, ref) => (
    <AlertDialogPortal>
        <AlertDialogOverlay />
        <AlertDialogPrimitive.Content
            {...props}
            ref={ref}
            className={cn(
                "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg md:w-full",
                className,
            )}
        />
    </AlertDialogPortal>
));
AlertDialogContent.displayName = AlertDialogPrimitive.Content.displayName;

interface AlertDialogHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
    className?: string;
}

function AlertDialogHeader({ className, ...props }: AlertDialogHeaderProps) {
    return (
        <div
            className={cn(
                "flex flex-col space-y-2 text-center sm:text-left",
                className,
            )}
            {...props}
        />
    );
}
AlertDialogHeader.displayName = "AlertDialogHeader";

interface AlertDialogFooterProps extends React.HTMLAttributes<HTMLDivElement> {
    className?: string;
}

function AlertDialogFooter({ className, ...props }: AlertDialogFooterProps) {
    return (
        <div
            className={cn(
                "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
                className,
            )}
            {...props}
        />
    );
}
AlertDialogFooter.displayName = "AlertDialogFooter";

interface AlertDialogTitleProps
    extends React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Title> {
    className?: string;
}

const AlertDialogTitle = React.forwardRef<
    React.ElementRef<typeof AlertDialogPrimitive.Title>,
    AlertDialogTitleProps
>(({ className, ...props }, ref) => (
    <AlertDialogPrimitive.Title
        {...props}
        ref={ref}
        className={cn("text-lg font-semibold", className)}
    />
));
AlertDialogTitle.displayName = AlertDialogPrimitive.Title.displayName;

interface AlertDialogDescriptionProps
    extends React.ComponentPropsWithoutRef<
        typeof AlertDialogPrimitive.Description
    > {
    className?: string;
}

const AlertDialogDescription = React.forwardRef<
    React.ElementRef<typeof AlertDialogPrimitive.Description>,
    AlertDialogDescriptionProps
>(({ className, ...props }, ref) => (
    <AlertDialogPrimitive.Description
        {...props}
        ref={ref}
        className={cn("text-sm text-muted-foreground", className)}
    />
));
AlertDialogDescription.displayName =
    AlertDialogPrimitive.Description.displayName;

interface AlertDialogActionProps
    extends React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Action> {
    className?: string;
}

const AlertDialogAction = React.forwardRef<
    React.ElementRef<typeof AlertDialogPrimitive.Action>,
    AlertDialogActionProps
>(({ className, ...props }, ref) => (
    <AlertDialogPrimitive.Action
        {...props}
        ref={ref}
        className={cn(buttonVariants(), className)}
    />
));
AlertDialogAction.displayName = AlertDialogPrimitive.Action.displayName;

interface AlertDialogCancelProps
    extends React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Cancel> {
    className?: string;
}

const AlertDialogCancel = React.forwardRef<
    React.ElementRef<typeof AlertDialogPrimitive.Cancel>,
    AlertDialogCancelProps
>(({ className, ...props }, ref) => (
    <AlertDialogPrimitive.Cancel
        {...props}
        ref={ref}
        className={cn(
            buttonVariants({ variant: "outline" }),
            "mt-2 sm:mt-0",
            className,
        )}
    />
));
AlertDialogCancel.displayName = AlertDialogPrimitive.Cancel.displayName;

export {
    AlertDialog,
    AlertDialogPortal,
    AlertDialogOverlay,
    AlertDialogTrigger,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogFooter,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogAction,
    AlertDialogCancel,
};
