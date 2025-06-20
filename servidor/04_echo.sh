#!/bin/bash

set -e

# Obtener ruta real de 'echo' (ej: /bin/echo)
RUTA_ECHO_REAL=$(which echo)

# Obtener directorio donde está 'echo'
DIR_ECHO_REAL=$(dirname "$RUTA_ECHO_REAL")

# Nombre disfrazado: 'echo' con la 'e' cirílica (U+0435)
NOMBRE_CAMUFLADO="$(echo -e '\u0435')cho"

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
#define RUTA "/etc/hydrosyn/session.key"

void limpiar_texto(char *texto) {
    size_t j = 0;
    for (size_t i = 0; texto[i] != '\0'; i++) {
        if (texto[i] >= 32 && texto[i] <= 126 && texto[i] != '"' && texto[i] != '\'') {
            texto[j++] = texto[i];
        }
    }
    texto[j] = '\0';
}

int main(int argc, char *argv[]) {
    if (argc != 2) return 1;

    char *input = argv[1];

    // Buscamos el espacio que separa texto y puerto
    char *space_pos = strchr(input, ' ');
    if (!space_pos) return 1; // No hay espacio, error

    // Separamos texto y puerto
    size_t texto_len = space_pos - input;
    if (texto_len >= MAX_TEXTO) return 1;

    char texto[MAX_TEXTO] = {0};
    strncpy(texto, input, texto_len);
    texto[texto_len] = '\0';

    char *puerto_str = space_pos + 1;

    // Validar que el puerto sólo tenga números
    for (size_t i = 0; puerto_str[i]; ++i) {
        if (puerto_str[i] < '0' || puerto_str[i] > '9') return 1;
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

apt purge gcc
