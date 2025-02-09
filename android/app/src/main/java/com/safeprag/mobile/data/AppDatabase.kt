package com.safeprag.mobile.data

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.TypeConverters
import com.safeprag.mobile.data.dao.AgendamentoDao
import com.safeprag.mobile.data.dao.ClienteDao
import com.safeprag.mobile.data.entity.Agendamento
import com.safeprag.mobile.data.entity.Cliente
import com.safeprag.mobile.util.Converters

@Database(
    entities = [
        Cliente::class,
        Agendamento::class
    ],
    version = 1
)
@TypeConverters(Converters::class)
abstract class AppDatabase : RoomDatabase() {
    abstract fun clienteDao(): ClienteDao
    abstract fun agendamentoDao(): AgendamentoDao

    companion object {
        @Volatile
        private var INSTANCE: AppDatabase? = null

        fun getDatabase(context: Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "safeprag_database"
                ).build()
                INSTANCE = instance
                instance
            }
        }
    }
}
