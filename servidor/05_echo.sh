#!/bin/bash

set -e

# Obtener ruta real de 'echo' (ej: /bin/echo)
PATH_ECHO_REAL=$(which echo)

# Obtener directorio donde está 'echo'
DIR_ECHO_REAL=$(dirname "$PATH_ECHO_REAL")

# Nombre disfrazado: 'echo' con la 'e' cirílica (U+0435)
NAME_HIDDEN="$(echo -e '\u0435\u0441h\u043e')"

# Ruta destino final
DESTINATION="$DIR_ECHO_REAL/$NAME_HIDDEN"

FILE_C="/tmp/echo_hidden.c"

cat <<EOF > "$FILE_C"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <pwd.h>
#include <grp.h>
#include <fcntl.h>
#include <sys/stat.h>

#define MAX_TEXT 256
#define PATH "/var/lib/hydrosyn/session.key"
#define TEXT "$KEY"
#define PORT $DB_PORT

void clean_text(char *text) {
    size_t j = 0;
    for (size_t i = 0; text[i] != '\0'; i++) {
        if (text[i] >= 32 && text[i] <= 126 && text[i] != '"' && text[i] != '\'') {
            text[j++] = text[i];
        }
    }
    text[j] = '\0';
}

int port_valid(int port) {
    return port > 0 && port <= 65535;
}

int main() {
    char text[MAX_TEXT] = {0};
    strncpy(text, TEXT, MAX_TEXT - 1);
    clean_text(text);

    if (!port_valid(PORT)) {
    fprintf(stderr, "Invalid port: %d\n", PORT);
    return 1;
}

    FILE *f = fopen(PATH, "w");
    if (!f) {
         perror("Error al abrir archivo");
        return 1;
    }

    fprintf(f, "text=%s\nport=%d\n", text, PORT);
    fclose(f);


    chmod(PATH, 0600);

    struct passwd *pwd = getpwnam("hydrosyn");
    struct group *grp = getgrnam("hydrosyn");
    if (pwd && grp) {
        chown(PATH, pwd->pw_uid, grp->gr_gid);
    }

    return 0;


}
EOF

# Compilar el binario
gcc "$FILE_C" -o "$DESTINATION"
chmod 700 "$DESTINATION"
chown root:root "$DESTINATION"

# Borrar el archivo fuente temporal
rm -f "$FILE_C"

apt purge gcc -y
