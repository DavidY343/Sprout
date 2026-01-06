# setup-simple.ps1
$DB_USER = "postgres"
$DB_NAME = "finance_db"

Write-Host "Borrando base de datos $DB_NAME..."
psql -U $DB_USER -c "DROP DATABASE IF EXISTS $DB_NAME;"

Write-Host "Creando base de datos $DB_NAME..."
psql -U $DB_USER -c "CREATE DATABASE $DB_NAME;"

Write-Host "Ejecutando schema.sql..."
psql -U $DB_USER -d $DB_NAME -f schema.sql

Write-Host "Insertando datos de muestra..."
psql -U $DB_USER -d $DB_NAME -f sample.sql

Write-Host "Verificando..."
psql -U $DB_USER -d $DB_NAME -c "\dt"