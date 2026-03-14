import requests
from bs4 import BeautifulSoup

def get_latest_scams():
    url = "https://www.scamadviser.com/latest-scams"

    res = requests.get(url)
    soup = BeautifulSoup(res.text,"html.parser")

    scams = []

    for item in soup.select(".scam-item")[:10]:
        title = item.text.strip()
        scams.append(title)

    return scams
