import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="blank-slate" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <AlertTriangle size={40} style={{ color: 'var(--red-coral)', margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-headline)' }}>
            Terjadi Kendala Memuat Tampilan
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '500px', margin: '0 auto 20px' }}>
            {this.state.error?.message || 'Komponen mengalami kendala rendering. Silakan segarkan komponen ini.'}
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={this.handleReset}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              background: 'var(--blue-primary)',
              color: '#fff',
              border: 'none',
              borderRadius: 'var(--rad-md)',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={16} /> Segarkan Tampilan
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
