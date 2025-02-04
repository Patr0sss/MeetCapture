# MeetCapture

Projekt wykonany na zaliczenie przedmiotu Inżynieria Oprogramowania
Jest to program do nagrania spotkania i przygotowania  raportu pdf z tranksrypcją, OCRem treści lub screenami w przypadku mało czytelnych znaków oraz streszczeniem całego spotkania.

## Instrukcja - Backend

Aby zbuildować frontend - wtyczkę do przeglądarki google chrome należy mieć zainstalowany yarn i wykonać następujące polecenie:

```bash
yarn
yarn build
```

Stworzy nam się folder z zbuildowaną wtyczką, aby zaimportować wtyczkę w Google Chrome w trybie deweloperskim należy wejść w rozszerzenia i podać ścieżkę do katalogu

## Instrukcja - Backend

Zalecane jest stworzenie wirtualnego środowiska oprogramowaniem conda, ze względu na to że użyty model do tranksrypcji WhisperX  również z tego korzysta
Instrukcja z inicjalizacją modelu dostępna jest na repozytorium: https://github.com/m-bain/whisperX

```bash
conda create --name <nazwa>
conda activate <nazwa>
```

w katalogu backend, będąc na stworzonym wirtualnym środowisku należy pobrać wszystkie zależności

```bash
pip install -r requirements.txt
```

Backend uruchamiamy przez main.py

```python
python main.py
```
