// Aplica o tema escuro antes do React carregar. Mesma regra de src/features/tema/tema.ts.
try {
  var tema = localStorage.getItem('tema')
  if (tema === 'escuro' || (tema !== 'claro' && matchMedia('(prefers-color-scheme: dark)').matches))
    document.documentElement.classList.add('dark')
} catch {}
