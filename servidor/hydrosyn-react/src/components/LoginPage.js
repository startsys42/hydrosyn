return (
    <div className={`app ${tema}`} style={{ padding: 20, fontFamily: 'Arial' }}>
        <h1>{textos[idioma].login}</h1>
        <form onSubmit={handleSubmit} style={{ maxWidth: 300 }}>
            <label>
                {textos[idioma].usuario}:
                <input
                    type="text"
                    value={usuario}
                    onChange={(e) => setUsuario(e.target.value)}
                    style={{ width: '100%', marginBottom: 5 }}
                />
                {errores.usuario && (
                    <div style={{ color: 'red', fontSize: 12 }}>{errores.usuario}</div>
                )}
            </label>

            <label>
                {textos[idioma].contraseña}:
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <input
                        type={mostrarPass ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={{ flex: 1, marginBottom: 5 }}
                    />
                    <button
                        type="button"
                        onClick={() => setMostrarPass(!mostrarPass)}
                        style={{ marginLeft: 5 }}
                    >
                        {mostrarPass ? textos[idioma].ocultar : textos[idioma].mostrar}
                    </button>
                </div>
                {errores.password && (
                    <div style={{ color: 'red', fontSize: 12 }}>{errores.password}</div>
                )}
            </label>

            <button type="submit" style={{ marginTop: 10, width: '100%' }}>
                {textos[idioma].login}
            </button>
        </form>

        <button
            onClick={toggleIdioma}
            style={{ marginTop: 20, marginRight: 10 }}
        >
            {textos[idioma].cambiarIdioma}
        </button>

        <button onClick={toggleTema} style={{ marginTop: 20 }}>
            {textos[idioma].cambiarTema}
        </button>

        <div style={{ marginTop: 30 }}>
            <button
                onClick={() => alert('Funcionalidad de recuperar contraseña')}
                style={{ color: 'blue', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
            >
                {textos[idioma].recuperarContraseña}
            </button>
        </div>

        <style>{`
        .app.claro {
          background: #fff;
          color: #000;
          min-height: 100vh;
        }
        .app.oscuro {
          background: #222;
          color: #eee;
          min-height: 100vh;
        }
        input {
          padding: 5px;
          font-size: 14px;
        }
        button {
          padding: 8px;
          font-size: 14px;
        }
      `}</style>
    </div>
);
}