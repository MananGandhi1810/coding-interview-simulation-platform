import * as React from "react";
import * as SeparatorPrimitive from "@radix-ui/react-separator";

import { cn } from "@/lib/utils.js";

const Separator = React.forwardRef(
    (
        { className, orientation = "horizontal", decorative = true, ...props },
        ref,
    ) => (
        <SeparatorPrimitive.Root
            ref={ref}
            decorative={decorative}
            orientation={orientation}
            className={cn("shrink-0 bg-border", className)}
            {...props}
        />
    ),
);
Separator.displayName = SeparatorPrimitive.Root.displayName;

export { Separator };
