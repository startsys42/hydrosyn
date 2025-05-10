
BASHRC="/root/.bashrc"

# Quitar el bloque entre los marcadores
sed -i '/# === VARS_FROM_CONF_ENV ===/,/# === END_VARS_FROM_CONF_ENV ===/d' "$BASHRC"

echo "Variables eliminadas de $BASHRC"
