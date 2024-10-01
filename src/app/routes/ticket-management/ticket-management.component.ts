import { ChangeDetectorRef, Component, ElementRef, ViewChild, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { PageHeaderComponent } from '@shared';
import {
    FormsModule,
    ReactiveFormsModule,
    Validators,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common'
import { MatDialogModule } from '@angular/material/dialog';
import { MtxGrid, MtxGridColumn, MtxGridModule } from '@ng-matero/extensions/grid';
import { MatIcon } from '@angular/material/icon';
import { Constant } from 'app/utility/constant';
import { TicketManagementService } from 'app/services/ticket-management.service';
import { MatMenu, MatMenuContent, MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { WebSocketSubject } from 'rxjs/webSocket';
import { WebsocketService } from 'app/services/websocket.service';
import { SharedWebSocketService } from 'app/services/shared-websocket.service';
import { Subscription } from 'rxjs';

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
    constructor(public name: string, public selected: boolean) { }
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
        MatMenuModule,
    ],
    templateUrl: './ticket-management.component.html',
    styleUrl: './ticket-management.component.css'
})
export class TicketManagementComponent {

    private ticketMgmtServ = inject(TicketManagementService);
    private readonly toast = inject(ToastrService);
    private webSocketService = inject(WebsocketService);

    @ViewChild('grid') grid!: MtxGrid;
    @ViewChild('subTicketGrid') subTicketGrid!: MtxGrid;

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
    selectedCount: any = { selectedtypeCount: 0, selectedPriorityCount: 0, selectedIssueRelatedCount: 0 }

    options: string[] = ['Option 1', 'Option 2', 'Option 3'];

    columns: MtxGridColumn[] = [
        {
            header: 'Ticket ID',
            field: 'id',
            minWidth: 50,
            width: '100px',
            showExpand: true
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
            field: 'assignedTo.userName',
            sortable: true,
            minWidth: 100,
            width: '100px',
        },
        {
            field: 'operation',
            minWidth: 100,
            width: '100px',
            pinned: 'right',
            type: 'button',
            buttons: [
                {
                    type: 'icon',
                    icon: 'edit',
                    tooltip: 'Edit the ticket',
                    click: record => this.editTicket(record),
                }
            ],
        },
    ];

    columns2: MtxGridColumn[] = [
        {
            header: 'Ticket ID',
            field: 'id',
            minWidth: 50,
            width: '100px',
        },
        {
            header: 'Subject',
            field: 'subject',
            sortable: true,
            minWidth: 150,
            width: '150px',
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
            field: 'assignedTo.userName',
            sortable: true,
            minWidth: 100,
            width: '100px',
        },
        {
            field: 'operation',
            minWidth: 50,
            width: '50px',
            pinned: 'right',
            type: 'button',
            buttons: [
                {
                    type: 'icon',
                    icon: 'edit',
                    tooltip: 'Edit the ticket',
                    click: (record: any) => this.editTicket(record),
                }
            ],
        },
    ];

    onExpandChange(e: any) {
        // console.log(e);
    }


    list: any[] = [];
    searchTerm: any;
    filters: Array<any> = []

    @ViewChild('input') input!: ElementRef;

    status: Filter[] = [
        new Filter('new', false),
        new Filter('In Progress', false),
        new Filter('Resolved', false),
    ]
    prioritys: Filter[] = [
        new Filter('Low', false),
        new Filter('Medium', false),
        new Filter('High', false),
        new Filter('Immediate', false),
    ];
    issueRelated: Filter[] = [
        new Filter('Software', false),
        new Filter('Hardware', false),
    ];

    constructor(private route: ActivatedRoute, private router: Router, private cdr: ChangeDetectorRef) {
    }

    private sharedWebSocketService = inject(SharedWebSocketService);
    websocketSubscription!: Subscription;

    ngOnInit(): void {
        this.loadTickets(0, '', '', '');
        setTimeout(() => {
            this.websocketSubscription = this.sharedWebSocketService.currentData.subscribe(resp => {
                if (resp != null) {
                    if (resp.created === 'ticket') {
                        this.websocketTriggered();
                    }
                }
            });
        }, 200)

    }

    websocketTriggered() {
        this.list = [];
        this.loadTickets(0, '', '', '');
        this.toast.success("New ticket assigned");
        this.sharedWebSocketService.makeNull();
    }

    ngAfterViewInit() {
        this.addScrollEventListener();
    }

    ngOnDestroy(): void {
        this.removeScrollEventListener();
        if (this.websocketSubscription) {
            this.websocketSubscription.unsubscribe();
        }
    };

    toggleDropdown(selectElement: any) {
        selectElement.toggle();
    }

    selectOption(option: string) {
        this.selectedOption = option;
        console.log('Selected option:', this.selectedOption);
    }

    loadTickets(pageNo: number = 0, issueRelated: any, priority: any, status: any) {
        this.isLoading = true;
        this.ticketMgmtServ.getAllTicket(pageNo, this.pageSize, issueRelated, priority, status).subscribe({
            next: response => {
                if (response.status == Constant.SUCCESS) {
                    // console.log(response);
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
        if (this.isFilterEnabled) {
            this.loadTickets(++this.pageNo, this.searchCriteriaObj.issueRelated, this.searchCriteriaObj.priority, this.searchCriteriaObj.status);
        } else {
            this.loadTickets(++this.pageNo, '', '', '');
        }
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

    selectStatusFilter($event: any, filter: Filter) {
        $event.stopPropagation();
        $event.preventDefault();
        if (filter.selected === false) {
            this.status.find(f => {
                if (f.name === filter.name) {
                    f.selected = true;
                } else { f.selected = false; }
            });
        } else {
            this.status.find(f => {
                if (f.name === filter.name) {
                    f.selected = false;
                } else { f.selected = false; }
            });
        }
        this.updateSelectedFilter();
    }

    selectPriorityFilter($event: any, filter: Filter) {
        $event.stopPropagation();
        $event.preventDefault();
        if (filter.selected === false) {
            this.prioritys.find(f => {
                if (f.name === filter.name) {
                    f.selected = true;
                } else { f.selected = false; }
            });
        } else {
            this.prioritys.find(f => {
                if (f.name === filter.name) {
                    f.selected = false;
                } else { f.selected = false; }
            });
        }
        this.updateSelectedFilter();
    }

    selectIssueRelatedFilter($event: any, filter: Filter) {
        $event.stopPropagation();
        $event.preventDefault();
        if (filter.selected === false) {
            this.issueRelated.find(f => {
                if (f.name === filter.name) {
                    f.selected = true;
                } else { f.selected = false; }
            });
        } else {
            this.issueRelated.find(f => {
                if (f.name === filter.name) {
                    f.selected = false;
                } else { f.selected = false; }
            });
        }
        this.updateSelectedFilter();
    }

    searchCriteriaObj = { status: "", priority: "", issueRelated: "" };
    isFilterEnabled: boolean = false;

    updateSelectedFilter() {
        this.selectedCount.selectedtypeCount = this.status.filter(a => a.selected).length;
        this.selectedCount.selectedPriorityCount = this.prioritys.filter(a => a.selected).length;
        this.selectedCount.selectedIssueRelatedCount = this.issueRelated.filter(a => a.selected).length;
        let selectedStatus = "";
        let selectedPriority = "";
        let selectedIssueRelated = "";
        this.status.forEach((obj: any) => {
            if (obj.selected == true) {
                if (obj.name === "In Progress") {
                    selectedStatus = "InProgress"
                } else {
                    selectedStatus = obj.name;
                }
            }
        });
        this.prioritys.forEach((obj: any) => {
            if (obj.selected == true) {
                selectedPriority = obj.name;
            }
        });
        this.issueRelated.forEach((obj: any) => {
            if (obj.selected == true) {
                selectedIssueRelated = obj.name;
            }
        });

        this.searchCriteriaObj.status = selectedStatus;
        this.searchCriteriaObj.priority = selectedPriority;
        this.searchCriteriaObj.issueRelated = selectedIssueRelated;
        if (this.searchCriteriaObj.issueRelated === "" &&
            this.searchCriteriaObj.priority === "" &&
            this.searchCriteriaObj.status === ""
        ) {
            this.isFilterEnabled = false;
        } else this.isFilterEnabled = true;

        this.list = []
        this.grid.dataSource.data = this.list;
        this.loadTickets(0, selectedIssueRelated, selectedPriority, selectedStatus);
    }

    editTicket(data: any) {
        // this.sharedService.set(data);
        this.router.navigate(['/ticketDetail', data.id]);
    }

    addNew() {
        this.router.navigate(['/ticketDetail']);
    }

    deleteTicket(ticket: any) {
        this.ticketMgmtServ.deleteTicket(ticket.id).subscribe({
            next: (response) => {
                if (response.status == Constant.SUCCESS) {
                    this.toast.success(response.message);
                    this.list = this.list.filter(item => item.id != ticket.id);
                    this.grid.dataSource.data = this.list;
                } else {
                    this.toast.error(response.message);
                }
            }, error(err) {
                console.log(err);
            },
        })
    }
}
