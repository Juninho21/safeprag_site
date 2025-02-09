package com.safeprag.mobile.util

import android.content.ContentValues
import android.content.Context
import android.provider.CalendarContract
import com.safeprag.mobile.data.entity.Agendamento
import java.util.TimeZone

class CalendarHelper {
    companion object {
        fun addEventToCalendar(context: Context, agendamento: Agendamento) {
            val startMillis = agendamento.data.atZone(TimeZone
                .getDefault().toZoneId()).toInstant().toEpochMilli()
            val endMillis = startMillis + 3600000 // 1 hora de duração

            val values = ContentValues().apply {
                put(CalendarContract.Events.DTSTART, startMillis)
                put(CalendarContract.Events.DTEND, endMillis)
                put(CalendarContract.Events.TITLE, "Serviço SafePrag - ${agendamento.nomeCliente}")
                put(CalendarContract.Events.DESCRIPTION, "Tipo: ${agendamento.tipoServico}")
                put(CalendarContract.Events.CALENDAR_ID, 1)
                put(CalendarContract.Events.EVENT_TIMEZONE, TimeZone.getDefault().id)
            }

            context.contentResolver.insert(CalendarContract.Events.CONTENT_URI, values)
        }
    }
}
