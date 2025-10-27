# 🚀 Script PowerShell para migrar projeto Supabase completo
# Origem: Profissionais-HITSS (pwksgdjjkryqryqrvyja)
# Destino: App-Financeiro (vvlmbougufgrecyyjxzb)

# Variáveis
$ORIGEM = "pwksgdjjkryqryqrvyja"
$DESTINO = "aawgghghrsdljdlrumfe"
$DUMP_FILE = "dump_app_financeiro.sql"

Write-Host "🔹 Dumpando banco de origem ($ORIGEM)..."
supabase db dump --project-ref $ORIGEM --schema public,auth,storage,extensions --file $DUMP_FILE

Write-Host "🔹 Restaurando dump no destino ($DESTINO)..."
supabase db restore $DUMP_FILE --project-ref $DESTINO

Write-Host "🔹 Exportando funções Edge Functions da origem..."
supabase functions pull --project-ref $ORIGEM

Write-Host "🔹 Deploy de todas Edge Functions no destino..."
$functions = Get-ChildItem -Path "supabase/functions" -Directory
foreach ($fn in $functions) {
    Write-Host "   → Deploy da função $($fn.Name)..."
    supabase functions deploy $fn.Name --project-ref $DESTINO
}

Write-Host "✅ Migração concluída com sucesso!"
Write-Host "Agora valide dados, auth, storage e edge functions no novo projeto."