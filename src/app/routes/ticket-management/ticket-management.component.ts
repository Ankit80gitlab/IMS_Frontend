import {Component, ElementRef, ViewChild, inject} from '@angular/core';
import {MatCardModule} from '@angular/material/card';
import {PageHeaderComponent} from '@shared';
import {
    FormsModule,
    ReactiveFormsModule,
    Validators,
} from '@angular/forms';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatSelectModule} from '@angular/material/select';
import {MatButtonModule} from '@angular/material/button';
import {ProductMangementService} from 'app/services/product-mangement.service';
import {CommonModule} from '@angular/common'
import {MatDialogModule} from '@angular/material/dialog';
import {MtxGrid, MtxGridColumn, MtxGridModule} from '@ng-matero/extensions/grid';
import {MatIcon} from '@angular/material/icon';
import {Constant} from 'app/utility/constant';
import {TicketManagementService} from 'app/services/ticket-management.service';
import {Subject, debounceTime, distinctUntilChanged, filter, fromEvent, tap} from 'rxjs';
import {MatMenu, MatMenuContent, MatMenuModule, MatMenuTrigger} from '@angular/material/menu';
import {ActivatedRoute, Router} from '@angular/router';

export interface TicketElement {
    id: number;
    sNo: number;
    type: string;
    assignee: string;
    priority: string;
    status: string;
    issueRelated: string;
    subject: string;
}

export class Filter {
    constructor(
        public name: string,
        public selected: boolean
    ) {
    }
}

@Component({
    selector: 'app-ticket-management',
    standalone: true,
    imports: [
        MatCardModule,
        PageHeaderComponent,
        MtxGridModule,
        MatFormFieldModule,
        CommonModule,
        MatButtonModule,
        MatInputModule,
        MatSelectModule,
        ReactiveFormsModule,
        FormsModule,
        MatDialogModule,
        MatIcon,
        MatMenu,
        MatMenuTrigger,
        MatMenuContent,
        MatMenuModule
    ],
    templateUrl: './ticket-management.component.html',
    styleUrl: './ticket-management.component.css'
})
export class TicketManagementComponent {
    isLoading = false;
    columnSortable = true;
    rowHover = false;
    rowStriped = false;
    showPaginator = false;
    pageNo: number = 0;
    pageSize: number = 50;
    selectedValue: any;
    selectedOption: string = '';
    typeArray: any[] = [];
    priorityArray: any[] = [];
    selectedCount: any = {selectedtypeCount: 0, selectedPriorityCount: 0}

    options: string[] = ['Option 1', 'Option 2', 'Option 3'];
    @ViewChild('grid')
    grid!: MtxGrid;
    columns: MtxGridColumn[] = [
        {
            header: 'S.No',
            field: 'sNo',
            minWidth: 50,
            width: '100px',
        },
        {
            header: 'Subject',
            field: 'subject',
            sortable: true,
            minWidth: 100,
            width: '100px',
        },
        {
            header: 'Type',
            field: 'type',
            sortable: true,
            minWidth: 100,
            width: '100px',
        },
        {
            header: 'Issue Related',
            field: 'issueRelated',
            sortable: true,
            minWidth: 100,
            width: '100px',
        },
        {
            header: 'Priority',
            field: 'priority',
            sortable: true,
            minWidth: 100,
            width: '100px',
        },
        {
            header: 'Status',
            field: 'status',
            sortable: true,
            minWidth: 100,
            width: '100px',
        },
        {
            header: 'Assignee',
            field: 'customer.name',
            sortable: true,
            minWidth: 100,
            width: '100px',
        },
        {
            field: 'operation',
            minWidth: 140,
            width: '140px',
            pinned: 'right',
            type: 'button',
            buttons: [
                {
                    type: 'icon',
                    icon: 'edit',
                    tooltip: 'Edit the ticket',
                    click: record => this.editTicket(record),
                },
            ],
        },
    ];
    list: any[] = [];
    searchTerm: any;
    filters: Array<any> = []
    @ViewChild('input')
    input!: ElementRef;
    types: Filter[] = [
        new Filter('Bug', false),
        new Filter('Feature', false),
        new Filter('Support', false),

    ]
    prioritys: Filter[] = [
        new Filter('High', false),
        new Filter('Low', false),
        new Filter('Medium', false),
    ];
    private ticketMgmtServ = inject(TicketManagementService);

    constructor(private route: ActivatedRoute, private router: Router) {
    }

    ngOnInit(): void {

        this.route.queryParams.subscribe(params => {
            const typeParam = params['type'];
            const priorityParam = params['priority'];
            this.typeArray = typeParam?.split(',');
            this.priorityArray = priorityParam?.split(',');
        });
        let i = 0;
        this.typeArray?.forEach(type => {
            const filter = this.types.find(f => f.name === type.trim());
            if (filter) {
                filter.selected = true;
                i++;
            }
        });

        let j = 0;
        this.priorityArray?.forEach(priority => {
            const filter = this.prioritys.find(f => f.name === priority.trim());
            if (filter) {
                filter.selected = true;
                j++;
            }
        });
        this.selectedCount.selectedtypeCount = i;
        this.selectedCount.selectedPriorityCount = j;
        this.loadTickets("", 0, this.typeArray, this.priorityArray);

    }

    ngAfterViewInit() {
        this.addScrollEventListener();
        fromEvent(this.input.nativeElement, 'keyup')
            .pipe(
                filter(Boolean),
                debounceTime(500),
                distinctUntilChanged(),
                tap(text => {
                    this.list = []
                    this.pageNo = 0;
                    this.loadTickets(this.searchTerm, 0);
                })
            )
            .subscribe();
    }

    ngOnDestroy(): void {
        this.removeScrollEventListener();
    };

    toggleDropdown(selectElement: any) {
        selectElement.toggle();
    }

    selectOption(option: string) {
        this.selectedOption = option;
        console.log('Selected option:', this.selectedOption);
    }

    loadTickets(term: string = '', pageNo: number = 0, priority: any[] = [], type: any[] = []) {
        this.isLoading = true;
        this.ticketMgmtServ.getAllTicket(term, pageNo, this.pageSize, type, priority).subscribe({
            next: response => {
                console.log(response)
                if (response.status == Constant.SUCCESS) {
                    let i = 0;
                    response.data.forEach((ticket: TicketElement) => {
                        ticket.sNo = this.pageSize * pageNo + i + 1;
                        this.list.push(ticket);
                        i++;
                    });
                    this.grid.dataSource.data = this.list;
                    this.isLoading = false;
                }
            },
            error: err => {
                console.log(err);
                this.isLoading = false;
            },
        });
    }

    Fetch() {
        this.loadTickets(this.searchTerm, ++this.pageNo);
    }

    addScrollEventListener(): void {
        if (this.grid.tableContainer && this.grid.tableContainer.nativeElement) {
            this.grid.tableContainer.nativeElement.addEventListener('scroll', this.onTableScroll.bind(this));
        }
    }

    removeScrollEventListener(): void {
        if (this.grid.tableContainer && this.grid.tableContainer.nativeElement) {
            this.grid.tableContainer.nativeElement.removeEventListener('scroll', this.onTableScroll.bind(this));
        }
    }

    onTableScroll(event: Event): void {
        const element = (event.target as HTMLElement);
        const atBottom = element.scrollHeight - element.scrollTop - 5 <= element.clientHeight;
        if (atBottom) {
            this.Fetch();
        }
    }

    selectFilter($event: any, filter: Filter) {
        // prevent menu from closing
        $event.stopPropagation();
        $event.preventDefault();
        // toggle selected state on clicked animal
        filter.selected = !filter.selected;
        // update selection vars
        this.updateSelectedFilter();
    }

    updateSelectedFilter() {
        // get count by type
        this.selectedCount.selectedtypeCount = this.types.filter(a => a.selected).length;
        this.selectedCount.selectedPriorityCount = this.prioritys.filter(a => a.selected).length;
        this.list = []
        this.grid.dataSource.data = this.list;
        this.loadTickets("", 0, this.types, this.prioritys);

    }

    editTicket(data: any) {
        this.router.navigate(['/ticketDetail', data.id]);
    }

    addNew() {
        this.router.navigate(['/ticketDetail']);
    }
}
