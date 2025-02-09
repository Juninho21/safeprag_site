package com.safeprag.mobile.util

import android.content.Context
import android.content.Intent
import android.net.Uri
import androidx.core.content.FileProvider
import com.itextpdf.kernel.pdf.PdfDocument
import com.itextpdf.kernel.pdf.PdfWriter
import com.itextpdf.layout.Document
import com.itextpdf.layout.element.Paragraph
import com.safeprag.mobile.data.entity.Agendamento
import java.io.File
import java.io.FileOutputStream
import java.time.format.DateTimeFormatter

class PdfGenerator {
    companion object {
        fun generateAndSharePdf(context: Context, agendamento: Agendamento) {
            val formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")
            val fileName = "agendamento_${agendamento.id}.pdf"
            val file = File(context.cacheDir, fileName)
            
            FileOutputStream(file).use { fos ->
                val writer = PdfWriter(fos)
                val pdf = PdfDocument(writer)
                val document = Document(pdf)

                document.add(Paragraph("Comprovante de Agendamento"))
                document.add(Paragraph("Data: ${agendamento.data.format(formatter)}"))
                document.add(Paragraph("Cliente: ${agendamento.nomeCliente}"))
                document.add(Paragraph("Serviço: ${agendamento.tipoServico}"))
                
                document.close()
            }

            val uri = FileProvider.getUriForFile(
                context,
                "${context.packageName}.provider",
                file
            )

            val intent = Intent(Intent.ACTION_SEND).apply {
                type = "application/pdf"
                putExtra(Intent.EXTRA_STREAM, uri)
                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            }

            context.startActivity(Intent.createChooser(intent, "Compartilhar PDF"))
        }
    }
}
