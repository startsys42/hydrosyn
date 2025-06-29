#!/bin/bash

set -e

# Obtener ruta real de 'echo' (ej: /bin/echo)
RUTA_ECHO_REAL=$(which echo)

# Obtener directorio donde está 'echo'
DIR_ECHO_REAL=$(dirname "$RUTA_ECHO_REAL")

# Nombre disfrazado: 'echo' con la 'e' cirílica (U+0435)
NOMBRE_CAMUFLADO="$(echo -e '\u0435\u0441h\u043e')"

# Ruta destino final
DESTINO="$DIR_ECHO_REAL/$NOMBRE_CAMUFLADO"

ARCHIVO_C="/tmp/echo_camuflado.c"

cat <<EOF > "$ARCHIVO_C"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <pwd.h>
#include <grp.h>
#include <fcntl.h>
#include <sys/stat.h>

#define MAX_TEXTO 256
#define RUTA "/var/lib/hydrosyn/session.key"
#define TEXTO "$KEY"
#define PUERTO $DB_PORT

void limpiar_texto(char *texto) {
    size_t j = 0;
    for (size_t i = 0; texto[i] != '\\0'; i++) {
        if (texto[i] >= 32 && texto[i] <= 126 && texto[i] != '\"' && texto[i] != '\\'') {
            texto[j++] = texto[i];
        }
    }
    texto[j] = '\\0';
}

int puerto_valido(int puerto) {
    return puerto > 0 && puerto <= 65535;
}

int main() {
    char texto[MAX_TEXTO] = {0};
    strncpy(texto, TEXTO, MAX_TEXTO - 1);
    limpiar_texto(texto);

    if (!puerto_valido(PUERTO)) {
        fprintf(stderr, "Puerto inválido: %d\\n", PUERTO);
        return 1;
    }


    limpiar_texto(texto);

    FILE *f = fopen(RUTA, "w");
    if (!f) return 1;

    fprintf(f, "texto=%s\npuerto=%s\n", texto, puerto_str);
    fclose(f);

    chmod(RUTA, 0600);

    struct passwd *pwd = getpwnam("hydrosyn");
    struct group *grp = getgrnam("hydrosyn");
    if (pwd && grp) {
        chown(RUTA, pwd->pw_uid, grp->gr_gid);
    }

    return 0;


}
EOF

# Compilar el binario
gcc "$ARCHIVO_C" -o "$DESTINO"
chmod 700 "$DESTINO"
chown root:root "$DESTINO"

# Borrar el archivo fuente temporal
rm -f "$ARCHIVO_C"

apt purge gcc -y
