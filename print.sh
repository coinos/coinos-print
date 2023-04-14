pdfcrop /root/coinos-print/printout.pdf /root/coinos-print/cropped.pdf
pdftoppm -png /root/coinos-print/cropped.pdf > /root/coinos-print/printout.png
python3 /usr/share/phomemo/phomemo-filter.py /root/coinos-print/printout.png >> /dev/usb/lp0
