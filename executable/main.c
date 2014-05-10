#include <stdlib.h>
int main(int argc, char const *argv[]) {
	system("set PATH=%PATH%;%CD%\bin\ffmpeg");
	system("node server.js");
	return 0;
}
