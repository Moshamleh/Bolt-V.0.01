import openai

openai.api_key = "sk-proj-..."  # Replace with your actual key

response = openai.FineTuningJob.create(
    training_file="file-N4tMbdMZy44p5haC1qpnCP",
    model="gpt-3.5-turbo",
    suffix="bolt-mechanic"
)

print(response)
