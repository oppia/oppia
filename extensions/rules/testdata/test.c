#include <gtk/gtk.h>

int main(int argc, char** argv)
{
  GtkWidget* win;

  gtk_init(&argc, &argv);

  win = gtk_window_new(GTK_WINDOW_TOPLEVEL);
  g_signal_connect(G_OBJECT(win), "delete-event", G_CALLBACK(gtk_main_quit), NULL);

  gtk_container_add(GTK_CONTAINER(win), gtk_label_new("Hello, world!"));

  gtk_widget_show_all(win);
  gtk_main();

  return 0;
}
