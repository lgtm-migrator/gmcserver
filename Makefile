all: | web server emails

server:
	$(MAKE) -C gmcserver-server
web:
	$(MAKE) -C gmcserver-web
emails:
	$(MAKE) -C gmcserver-email

DEST_BIN = $(DESTDIR)/usr/bin
DEST_WEB = $(DESTDIR)/var/www/html
DEST_CONF = $(DESTDIR)/etc/gmcserver
DEST_SERVICE = $(DESTDIR)/lib/systemd/system

DEST_MAILS = $(DEST_CONF)/mail-templates

install-server:
	$(MAKE) DESTDIR=$(DESTDIR) -C gmcserver-server install-server

install-web:
	$(MAKE) DESTDIR=$(DESTDIR) -C gmcserver-web install-web

install-emails:
	$(MAKE) DESTDIR=$(DESTDIR) -C gmcserver-email install-emails

install: | install-server install-web install-emails

#clean:
#	#mvn -o clean
#	rm -rI target
#	$(MAKE) -C gmcserver-web clean
