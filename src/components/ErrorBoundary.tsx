'use client';

import { Component, type ReactNode, type ErrorInfo } from 'react';

interface Props {
    children: ReactNode;
    /** Mensaje a mostrar en el fallback (opcional) */
    label?: string;
}

interface State {
    hasError: boolean;
    message: string;
}

/**
 * Error Boundary genérico para componentes 3D/WebGL.
 * React necesita una class component para capturar errores en el árbol.
 *
 * Uso:
 *   <ErrorBoundary label="Estrellas">
 *     <Stars />
 *   </ErrorBoundary>
 *
 * En producción muestra un fallback mínimo (no pantalla blanca).
 * En desarrollo vuelca el mensaje en consola para diagnóstico.
 */
export default class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, message: '' };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, message: error.message };
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        const label = this.props.label ?? 'componente';
        console.error(`[ErrorBoundary] Crash en ${label}:`, error, info.componentStack);
    }

    render() {
        if (this.state.hasError) {
            // Fallback invisible en modo producción — no rompe el lienzo 3D restante
            return null;
        }
        return this.props.children;
    }
}
