from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas

output = "/tmp/candidato-demo-cv.pdf"
page = canvas.Canvas(output, pagesize=A4)
page.setTitle("CV de demonstração — OkutiJobs")
page.setFont("Helvetica-Bold", 18)
page.drawString(54, 790, "Candidato Demonstração")
page.setFont("Helvetica", 11)
page.drawString(54, 766, "CV de demonstração para validação do fluxo OkutiJobs")
page.drawString(54, 738, "Técnico administrativo · Luanda, Angola")
page.drawString(54, 710, "Licenciatura em Gestão e Administração")
page.drawString(54, 682, "Competências: organização, Excel, atendimento e comunicação profissional")
page.drawString(54, 654, "Este documento não representa uma candidatura real.")
page.save()
print(output)
