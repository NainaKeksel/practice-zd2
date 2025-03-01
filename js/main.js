Vue.component('note', {
    props: ['card', 'columnIndex'],
    template: `
        <div class="note" :class="{ locked: card.locked }">
            <p class="title">{{ card.title }}</p>
            <ul>
                <li v-for="(item, index) in card.items" :key="index" class="anti-dots">
                    <input 
                        type="checkbox" 
                        :checked="item.completed" 
                        @change="toggleItem(index)" 
                        :disabled="card.locked"
                    />
                    {{ item.text }}
                </li>
            </ul>
            <p v-if="card.completedDate">Дата окончания: {{ card.completedDate }}</p>
        </div>
    `,
    methods: {
        toggleItem(index) {
            this.$emit('update-item', { cardIndex: this.card.index, itemIndex: index, columnIndex: this.columnIndex });
        }
    }
});

new Vue({
    el: '#app',
    data() {
        return {
            columns: [
                { title: 'Три карточки', cards: [], locked: false },
                { title: 'Пять карточек', cards: [] },
                { title: 'Бесконечно карточек', cards: [] }
            ],
            newCardTitle: '',
            newCardItems: ['', '', '', '', ''],
            maxCardsInColumnOne: 3,
            maxCardsInColumnTwo: 5
        };
    },
    created() {
        const savedData = JSON.parse(localStorage.getItem('noteAppData'));
        if (savedData) {
            this.columns = savedData.columns;
        }
    },
    watch: {
        columns: {
            deep: true,
            handler() {
                localStorage.setItem('noteAppData', JSON.stringify({ columns: this.columns }));
            }
        }
    },
    methods: {
        canAddCard(columnIndex) {
            if (columnIndex === 0 && this.columns[0].cards.length >= this.maxCardsInColumnOne) return false;
            if (columnIndex === 1 && this.columns[1].cards.length >= this.maxCardsInColumnTwo) return false;
            return true;
        },
        addCard(columnIndex) {
            this.checkLockState();
            const items = this.newCardItems
                .filter(item => item.trim() !== '') // Убираем пустые пункты
                .map(item => ({ text: item, completed: false }));
            if (items.length < 3 || items.length > 5) {
                alert('Карточка должна содержать от 3 до 5 пунктов.');
                return;
            }
            const newCard = {
                title: this.newCardTitle,
                items: items,
                locked: false,
                completedDate: null
            };
            this.columns[columnIndex].cards.push(newCard);
            this.newCardTitle = '';
            this.newCardItems = ['', '', '', '', ''];
        },
        toggleItem(columnIndex, cardIndex, itemIndex) {
            this.checkLockState();
            const card = this.columns[columnIndex].cards[cardIndex];
            if (card.locked) return; // Если карточка заблокирована, ничего не делаем
            card.items[itemIndex].completed = !card.items[itemIndex].completed;
            this.checkCardCompletion(columnIndex, cardIndex);
        },
        checkCardCompletion(columnIndex, cardIndex) {
            const card = this.columns[columnIndex].cards[cardIndex];
            const completedCount = card.items.filter(item => item.completed).length;
            const totalItems = card.items.length;
            if (columnIndex === 0 && completedCount / totalItems >= 0.5) {
                this.moveCard(columnIndex, 1, cardIndex);
            } else if (columnIndex === 1 && completedCount / totalItems < 0.5) {
                this.moveCard(columnIndex, 0, cardIndex);
            } else if (columnIndex !== 2 && completedCount === totalItems) {
                this.moveCard(columnIndex, 2, cardIndex);
            }
        },
        moveCard(fromColumn, toColumn, cardIndex) {
            this.checkLockState();
            const card = this.columns[fromColumn].cards.splice(cardIndex, 1)[0];
            card.completedDate = toColumn === 2 ? new Date().toLocaleString() : null;
            this.columns[toColumn].cards.push(card);
        },
        checkLockState() {
            const isSecondColumnFull = this.columns[1].cards.length >= this.maxCardsInColumnTwo;
            const hasOver50Percent = this.columns[0].cards.some(card => {
                const completedCount = card.items.filter(item => item.completed).length;
                return completedCount / card.items.length >= 0.5;
            });
            this.columns[0].locked = isSecondColumnFull && hasOver50Percent;
            this.columns[0].cards.forEach(card => {
                card.locked = this.columns[0].locked;
            });
        }
    },
    computed: {
        isAddButtonDisabled() {
            const isSecondColumnFull = this.columns[1].cards.length >= this.maxCardsInColumnTwo;
            const hasOver50Percent = this.columns[0].cards.some(card => {
                const completedCount = card.items.filter(item => item.completed).length;
                return completedCount / card.items.length >= 0.5;
            });
            return isSecondColumnFull && hasOver50Percent;
        }
    },
    template: `
    <div id="app">
        <div v-for="(column, columnIndex) in columns" :key="columnIndex" class="column">
            <h2>{{ column.title }}</h2>
            <form v-if="columnIndex === 0 && canAddCard(columnIndex)" @submit.prevent="addCard(columnIndex)">
                <input class="form" type="text" v-model="newCardTitle" placeholder="Заголовок" required>
                <input class="form" type="text" v-model="newCardItems[0]" placeholder="Карточка 1" required>
                <input class="form" type="text" v-model="newCardItems[1]" placeholder="Карточка 2" required>
                <input class="form" type="text" v-model="newCardItems[2]" placeholder="Карточка 3" required>
                <input class="form" type="text" v-model="newCardItems[3]" placeholder="Карточка 4 (опционально)">
                <input class="form" type="text" v-model="newCardItems[4]" placeholder="Карточка 5 (опционально)">
                <button type="submit" class="but" :disabled="isAddButtonDisabled">Добавить</button>
            </form>
            <div v-for="(card, cardIndex) in column.cards" :key="cardIndex" class="note" :class="{ locked: card.locked }">
                <p class="title">{{ card.title }}</p>
                <ul>
                    <li v-for="(item, index) in card.items" :key="index" class="anti-dots">
                        <input
                            type="checkbox"
                            :checked="item.completed"
                            @change="toggleItem(columnIndex, cardIndex, index)"
                            :disabled="card.locked"
                        />
                        {{ item.text }}
                    </li>
                </ul>
                <p v-if="card.completedDate">Дата окончания: {{ card.completedDate }}</p>
            </div>
        </div>
    </div>
    `
});