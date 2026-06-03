import { PhaserGame } from './PhaserGame';

function App() {
    return (
        <main
            style={{
                minHeight: '100vh',
                backgroundColor: '#050407',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}
        >
            <section
                style={{
                    border: '1px solid #3d271c',
                    boxShadow: '0 0 42px rgba(194, 80, 29, 0.18)',
                    lineHeight: 0
                }}
            >
                <PhaserGame />
            </section>
        </main>
    );
}

export default App;