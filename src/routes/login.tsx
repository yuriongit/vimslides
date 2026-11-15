import { createFileRoute } from "@tanstack/react-router";
import { LoginForm } from "#/components/login-form";

export const Route = createFileRoute("/login")({
	component: RouteComponent,
});

function RouteComponent() {
	return LoginForm({ className: "max-w-sm w-full" });
}
