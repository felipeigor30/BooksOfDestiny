import { PhaserGame } from './PhaserGame';

function App() {
    return (
        <main
            style={{
                width: '100vw',
                height: '100dvh',
                backgroundColor: '#050407',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                padding: '12px',
                boxSizing: 'border-box'
            }}
        >
            <section
                style={{
                    width: 'min(calc(100vw - 24px), calc((100dvh - 24px) * 4 / 3))',
                    height: 'min(calc(100dvh - 24px), calc((100vw - 24px) * 3 / 4))',
                    aspectRatio: '4 / 3',
                    border: '1px solid #3d271c',
                    boxShadow: '0 0 42px rgba(194, 80, 29, 0.18)',
                    boxSizing: 'border-box',
                    lineHeight: 0
                }}
            >
                <PhaserGame />
            </section>
        </main>
    );
}

export default App;