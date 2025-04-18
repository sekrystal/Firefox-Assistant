FROM python:3.8.18

WORKDIR /app

COPY ./requirements.txt /app/requirements.txt
RUN pip install -r /app/requirements.txt

COPY ./pdf_bot /app/pdf_bot

RUN printf '#!/bin/bash \n\
python /app/pdf_bot/pull_model.py \n\
streamlit run /app/pdf_bot/app.py' >> /app/pdf_bot/run.sh

CMD ["streamlit", "run", "main.py", "--server.port=8501", "--server.address=0.0.0.0"]