"use client";

import { FormEvent, useState } from "react";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { errorCode, inputClass, labelClass, primaryButton } from "@/lib/ui";
import Logo from "./Logo";
import ThemeToggle from "./ThemeToggle";

function getAuthErrorMessage(code: string) {
	switch (code) {
		case "auth/invalid-credential":
		case "auth/invalid-login-credentials":
		case "auth/user-not-found":
		case "auth/wrong-password":
			return "Correo o contraseña incorrecta.";
		case "auth/email-already-in-use":
			return "Ese correo ya está registrado.";
		case "auth/invalid-email":
			return "El correo electrónico no es válido.";
		case "auth/weak-password":
			return "La contraseña debe tener al menos 6 caracteres.";
		case "auth/missing-password":
			return "Debes ingresar una contraseña.";
		case "auth/network-request-failed":
			return "Error de conexión. Verifica tu internet e inténtalo de nuevo.";
		default:
			return "Ocurrió un error. Inténtalo nuevamente.";
	}
}

export default function AuthScreen() {
	const [mode, setMode] = useState<"login" | "register">("login");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [submitting, setSubmitting] = useState(false);

	const isLogin = mode === "login";

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setError("");
		setSubmitting(true);

		try {
			if (isLogin) {
				await signInWithEmailAndPassword(auth, email, password);
			} else {
				await createUserWithEmailAndPassword(auth, email, password);
			}
		} catch (err) {
			setError(getAuthErrorMessage(errorCode(err)));
		} finally {
			setSubmitting(false);
		}
	}

	function switchMode() {
		setMode(isLogin ? "register" : "login");
		setError("");
	}

	return (
		<div className="relative flex min-h-screen items-center justify-center bg-bg px-4 py-12">
			<ThemeToggle className="absolute top-4 right-4" />

			<div className="w-full max-w-sm">
				<div className="mb-8 flex flex-col items-center text-center">
					<Logo className="size-12 rounded-2xl" iconClassName="size-6" />
					<h1 className="mt-4 text-2xl font-semibold tracking-tight text-fg">Gestor de Tareas</h1>
					<p className="mt-1 text-sm text-muted">
						{isLogin
							? "Inicia sesión para ver tus tableros."
							: "Crea una cuenta para empezar a organizarte."}
					</p>
				</div>

				<form
					onSubmit={handleSubmit}
					className="space-y-4 rounded-2xl border border-line bg-surface p-6 shadow-sm"
				>
					<label className="block">
						<span className={labelClass}>Correo electrónico</span>
						<input
							type="email"
							autoComplete="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							placeholder="tu@universidad.edu"
							className={inputClass}
						/>
					</label>

					<label className="block">
						<span className={labelClass}>Contraseña</span>
						<input
							type="password"
							autoComplete={isLogin ? "current-password" : "new-password"}
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							placeholder="••••••••"
							className={inputClass}
						/>
					</label>

					{error ? (
						<p
							role="alert"
							className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300"
						>
							{error}
						</p>
					) : null}

					<button type="submit" disabled={submitting} className={`${primaryButton} w-full`}>
						{submitting ? "Un momento…" : isLogin ? "Iniciar sesión" : "Crear cuenta"}
					</button>
				</form>

				<p className="mt-6 text-center text-sm text-muted">
					{isLogin ? "¿No tienes cuenta?" : "¿Ya tienes cuenta?"}{" "}
					<button type="button" onClick={switchMode} className="font-medium text-accent hover:underline">
						{isLogin ? "Regístrate" : "Inicia sesión"}
					</button>
				</p>
			</div>
		</div>
	);
}
