import { TanStackDevtools } from "@tanstack/react-devtools";
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";

import "../index.css";

export const Route = createRootRoute({
	component: RootComponent,
});

function RootComponent() {
	return (
		<main
			className="
      flex flex-col justify-center items-center
      
      min-h-screen w-full
      "
		>
			<div
				className="
        // layout:
        flex flex-col justify-center items-center 
        // dimensions:
        max-w-7xl w-full
        "
			>
				<Outlet />
				<TanStackDevtools
					config={{
						position: "bottom-right",
					}}
					plugins={[
						{
							name: "TanStack Router",
							render: <TanStackRouterDevtoolsPanel />,
						},
					]}
				/>
			</div>
		</main>
	);
}
