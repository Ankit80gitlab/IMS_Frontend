import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, NgZone, OnInit, inject } from '@angular/core';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormControl, Validators, FormGroup, FormGroupDirective } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatFormFieldModule, MatFormField, MatLabel, MatHint, MatError } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MtxGridModule } from '@ng-matero/extensions/grid';
import { MtxSelectModule, MtxSelect } from '@ng-matero/extensions/select';
import { PageHeaderComponent } from '@shared';
import { WebsocketService } from 'app/services/websocket.service';
import { BehaviorSubject, catchError, debounceTime, Observable, of, Subject, Subscription, switchMap, take, tap } from 'rxjs';
import { MatChipsModule } from '@angular/material/chips';
import { ToastrService } from 'ngx-toastr';
import { UserManagementService } from 'app/services/user-management.service';
import { Constant } from 'app/utility/constant';
import { CustomerManagementService } from 'app/services/customer-management.service';
import { MtxProgressModule } from '@ng-matero/extensions/progress';
import { BarChart, BarSeriesOption, PieChart, PieSeriesOption } from 'echarts/charts';
import { TitleComponent, TooltipComponent, LegendComponent, TitleComponentOption, TooltipComponentOption, LegendComponentOption, GridComponent, GridComponentOption } from 'echarts/components';
import { LabelLayout } from 'echarts/features';
import { CanvasRenderer } from 'echarts/renderers';
import * as echarts from 'echarts/core';
import { DashboardService } from 'app/services/dashboard.service';
import { AuthService } from '@core/authentication/auth.service';
import { Router } from '@angular/router';
import { SharedWebSocketService } from 'app/services/shared-websocket.service';

echarts.use([TitleComponent, TooltipComponent, LegendComponent, PieChart, CanvasRenderer, LabelLayout]);
echarts.use([GridComponent, BarChart, CanvasRenderer]);

type graphChartsOption = echarts.ComposeOption<
  GridComponentOption | BarSeriesOption
>;

type pieEChartsOption = echarts.ComposeOption<
  | TitleComponentOption
  | TooltipComponentOption
  | LegendComponentOption
  | PieSeriesOption
>;

export interface customerStat {
  areaCount: number;
  ticketCount: number;
  userCount: number;
  deviceCount: number;
  zoneCount: number;
  customerCount: number;
  newTicketCount: number;
  InProgressTicketCount: number;
  resolved: number;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatCardModule,
    PageHeaderComponent,
    MtxGridModule,
    MatFormFieldModule,
    MatButtonModule,
    MatInputModule,
    MatSelectModule,
    ReactiveFormsModule,
    CommonModule,
    FormsModule,
    MtxSelectModule,
    MatCheckbox,
    MatFormField,
    MatLabel,
    MtxSelect,
    MatHint,
    MatError,
    MatChipsModule,
    MtxProgressModule],
})
export class DashboardComponent implements OnInit {

  private dashboardService = inject(DashboardService);
  private toast = inject(ToastrService);
  private customerService = inject(CustomerManagementService); private authService = inject(AuthService);
  private sharedWebSocketService = inject(SharedWebSocketService);


  constructor(private cdr: ChangeDetectorRef, private router: Router, private zone: NgZone) { }

  private customerSubject: BehaviorSubject<Object[]> = new BehaviorSubject<Object[]>([]);
  private customerSearchTerms = new Subject<string>();
  customer$: Observable<Object[]> = this.customerSubject.asObservable();
  customerSearchTermValue: string = '';
  customerLoading: boolean = false;
  customerPageNo: number = 0;

  stats: any = [];
  graphDom: any;
  pieDom: any;
  priorityPieDom: any;
  graphInstance: any;
  pieInstance: any;
  priorityPieInstance: any;
  isUserAdmin: boolean = false;

  userSubscription!: Subscription;
  websocketSubscription!: Subscription;
  loggedUser: any;
  customerUserForm!: FormGroup;

  ngOnInit(): void {

    this.graphDom = document.getElementById('graph');
    this.pieDom = document.getElementById('pie');
    this.priorityPieDom = document.getElementById('priorityPie');

    this.customerUserForm = new FormGroup({
      id: new FormControl(null, [Validators.required])
    });

    setTimeout(() => {
      this.zone.run(() => {
        // Your code here
        this.userSubscription = this.authService.user().subscribe(user => (this.loggedUser = user));
        console.log(this.loggedUser);

        if ('customerId' in this.loggedUser) {
          this.isUserAdmin = false;
          this.dashboardService.getCustomerStats(this.loggedUser.customerId).subscribe({
            next: resp => {
              if (resp.status == Constant.SUCCESS) {
                // console.log(resp);
                this.stats = this.getData(resp.data);
                this.cdr.detectChanges();
                this.initPieChart(resp.data);
                this.initPriorityPieChart(resp.data);
              }
            }, error(err) {
              console.log(err);
            },
          });
          this.dashboardService.getCustomerTicketCountStats(this.loggedUser.customerId).subscribe({
            next: resp => {
              if (resp.status == Constant.SUCCESS) {
                // console.log(resp);
                this.initGraph(resp.data);
              }
            }, error(err) {
              console.log(err);
            },
          });
        }
        else {
          this.isUserAdmin = true;
          this.cdr.detectChanges();

          let obj = [{ id: 0, name: "All" }]
          this.customerSubject.next(obj);
          this.loadCustomer().pipe(take(1))
            .subscribe(initialItems => {
              const currentItems = this.customerSubject.getValue();
              const updatedItems = currentItems.concat(initialItems);
              this.customerSubject.next(updatedItems);
            });

          this.customerUserForm.patchValue({ id: 0 });

          this.customerSearchTerms.pipe(
            debounceTime(300),
            tap(() => this.customerLoading = true),
            switchMap(term => {
              this.customerSearchTermValue = term;
              return this.loadCustomer(term);
            })
          ).subscribe(obj => {
            this.customerSubject.next(obj);
            this.customerLoading = false;
          });

          this.dashboardService.getCustomerStatsTotal().subscribe({
            next: resp => {
              if (resp.status == Constant.SUCCESS) {
                // console.log(resp);
                this.stats = this.getData(resp.data);
                this.cdr.detectChanges();
                this.initPieChart(resp.data);
                this.initPriorityPieChart(resp.data);
              }
            }, error(err) {
              console.log(err);
            },
          });
          this.dashboardService.getAllTicketCountStats().subscribe({
            next: resp => {
              if (resp.status == Constant.SUCCESS) {
                // console.log(resp);
                this.initGraph(resp.data);
              }
            }, error(err) {
              console.log(err);
            },
          });
        }
        let i = 0;
        this.websocketSubscription = this.sharedWebSocketService.currentData.subscribe(resp => {
          if (resp != null) {
            if (resp.created === 'ticket') {
              this.websocketTriggered();
            }
          }
        });
      });
    }, 500);
  }

  ngAfterViewInit(): void {
  }

  ngOnDestroy(): void {
    if (this.websocketSubscription) {
      this.websocketSubscription.unsubscribe();
    }
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
    // if (this.pieInstance) {
    //   this.pieInstance.dispose();
    // }
    // if (this.graphInstance) {
    //   this.graphInstance.dispose();
    // }
    // if (this.priorityPieInstance) {
    //   this.priorityPieInstance.dispose();
    // }
  }

  websocketTriggered() {
    let loggedUser: any;
    this.userSubscription = this.authService.user().subscribe(user => (loggedUser = user));
    if ('customerId' in loggedUser) {
      this.isUserAdmin = false;
      this.cdr.detectChanges();
      this.toast.success("New ticket assigned");
      this.sharedWebSocketService.makeNull();
      this.reset({ id: loggedUser.customerId });
    } else {
      this.isUserAdmin = true;
      this.cdr.detectChanges();
      this.customerUserForm.patchValue({ id: 0 });
      this.toast.success("New ticket assigned");
      this.sharedWebSocketService.makeNull();
      this.reset({ id: 0 });
    }
  }

  getData(data: any): any {
    let statData = [
      {
        title: 'ZONE',
        amount: data[1].zoneCount,
        progress: {
          value: 100,
        },
        color: 'bg-green-500',
      },
      {
        title: 'AREA',
        amount: data[1].areaCount,
        progress: {
          value: 100,
        },
        color: 'bg-teal-500',
      },
      {
        title: 'DEVICE',
        amount: data[1].deviceCount,
        progress: {
          value: 100,
        },
        color: 'bg-indigo-500',
      },
      {
        title: 'USER',
        amount: data[1].userCount,
        progress: {
          value: 100,
        },
        color: 'bg-blue-500',
      },
      {
        title: 'TICKET',
        amount: data[1].ticketCount,
        progress: {
          value: 100,
        },
        color: 'bg-green-500',
      },
    ];

    if (data[0].userType === "Admin" && 'customerCount' in data[1]) {
      let obj = {
        title: 'CUSTOMER',
        amount: data[1].customerCount,
        progress: {
          value: 100,
        },
        color: 'bg-teal-500',
      }
      statData.push(obj);
    }
    return statData;
  }

  ticketCountMap: any;

  initGraph(data: any) {
    this.ticketCountMap = Object.keys(data[1]).map(key => ({ date: key, count: data[1][key] }));
    let date: any = [];
    let count: any = [];
    for (let i of this.ticketCountMap) {
      date.push(i.date);
      count.push(i.count);
    }
    if (this.graphDom) {
      if (this.graphInstance) {
        this.graphInstance.dispose();
      }
      this.graphInstance = echarts.init(this.graphDom);
      var option!: graphChartsOption;
      option = {
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          }
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: [
          {
            type: 'category',
            data: date,
            axisTick: {
              alignWithLabel: true
            }
          }
        ],
        yAxis: [
          {
            type: 'value'
          }
        ],
        series: [
          {
            name: 'Ticket Status',
            type: 'bar',
            barWidth: '60%',
            data: count
          }
        ]
      };
      option && this.graphInstance.setOption(option);
    } else {
      console.error('DOM element for chart not found');
    }
  }

  initPieChart(data: any) {
    if (this.pieDom) {
      if (this.pieInstance) {
        this.pieInstance.dispose();
      }
      this.pieInstance = echarts.init(this.pieDom);
      var option!: pieEChartsOption;
      option = {
        title: {
          text: data[0].customerName,
          subtext: 'Ticket Status',
          left: 'center',
          textStyle: {
            color: 'white',
            fontSize: 14,
            fontWeight: 'bold',
          },
          subtextStyle: {
            color: 'white',
            fontSize: 12,
            fontWeight: 'normal',
          },
        },
        tooltip: {
          trigger: 'item'
        },
        legend: {
          orient: 'vertical',
          left: 'left',
          textStyle: {
            color: 'white',
            fontSize: 10,
          },
        },

        series: [
          {
            name: 'Tickets',
            type: 'pie',
            radius: '50%',
            data: [
              { value: data[1].resolved, name: 'Resolved' },
              { value: data[1].newTicketCount, name: 'New' },
              { value: data[1].InProgressTicketCount, name: 'In Progress' },
            ],
            label: {
              color: 'white',
              fontSize: 12,
            },
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: 'rgba(0, 0, 0, 0.5)',
              }
            }
          }
        ]
      };
      option && this.pieInstance.setOption(option);
    } else {
      console.error('DOM element for chart not found');
    }
  }

  initPriorityPieChart(data: any) {
    if (this.priorityPieDom) {
      if (this.priorityPieInstance) {
        this.priorityPieInstance.dispose();
      }
      this.priorityPieInstance = echarts.init(this.priorityPieDom);
      var option!: pieEChartsOption;
      option = {
        title: {
          text: data[0].customerName,
          subtext: 'Ticket Priority',
          left: 'center',
          textStyle: {
            color: 'white',
            fontSize: 14,
            fontWeight: 'bold',
          },
          subtextStyle: {
            color: 'white',
            fontSize: 12,
            fontWeight: 'normal',
          },
        },
        tooltip: {
          trigger: 'item'
        },
        legend: {
          orient: 'vertical',
          left: 'left',
          textStyle: {
            color: 'white',
            fontSize: 10,
          },
        },

        series: [
          {
            name: 'Tickets',
            type: 'pie',
            radius: '50%',
            data: [
              { value: data[1].lowTicketCount, name: 'Low' },
              { value: data[1].mediumTicketCount, name: 'Medium' },
              { value: data[1].immediateTicketCount, name: 'Immediate' },
              { value: data[1].highTicketCount, name: 'High' }
            ],
            label: {
              color: 'white',
              fontSize: 12,
            },
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: 'rgba(0, 0, 0, 0.5)',
              }
            }
          }
        ]
      };
      option && this.priorityPieInstance.setOption(option);
    } else {
      console.error('DOM element for priority chart not found');
    }
  }

  loadCustomer(term: string = '', pageNo: number = 0): Observable<Object[]> {
    return this.customerService.getAllCustomersBasicDetails(term, pageNo, 10).pipe(
      switchMap((response: any) => {
        let items: any = [];
        if (response.status == Constant.SUCCESS) {
          items = response.data;
        } else {
          if (response.message instanceof Object) {
            this.toast.error(response.message.text);
          } else {
            this.toast.error(response.message);
          }
        }
        return of(items);
      }),
      catchError((error: any) => {
        console.log(error);
        this.toast.error(Constant.SOMETHING_WENT_WRONG);
        return of([]);
      })
    );
  }

  onScrollCustomerEnd(): void {
    const currentItems = this.customerSubject.getValue();
    this.customerLoading = true;
    this.loadCustomer(this.customerSearchTermValue, ++this.customerPageNo).pipe(take(1)).subscribe(newItems => {
      const updatedItems = currentItems.concat(newItems);
      this.customerSubject.next(updatedItems);
      this.customerLoading = false;
    });
  }

  onCustomerSearch(event: { term: string }): void {
    this.customerPageNo = 0;
    this.customerSearchTerms.next(event.term);
  }

  onCustomerSelectionChange(event: any) {
    this.reset(event);
  }

  reset(event: any) {
    // console.log(event.id);
    if (event != undefined) {
      if (event.id == 0) {
        this.dashboardService.getCustomerStatsTotal().subscribe({
          next: response => {
            if (response.status === Constant.SUCCESS) {
              this.stats = this.getData(response.data);
              // if (response.data[0].userType === "Admin") {
              //   this.isUserAdmin = true;
              // } else {
              //   this.isUserAdmin = false;
              // }
              this.cdr.detectChanges();
              if (this.pieInstance) {
                this.pieInstance.setOption({
                  title: {
                    text: response.data[0].customerName,
                    subtext: 'Ticket Status',
                    left: 'center',
                    textStyle: {
                      color: 'white',
                      fontSize: 14,
                      fontWeight: 'bold',
                    },
                    subtextStyle: {
                      color: 'white',
                      fontSize: 12,
                      fontWeight: 'normal',
                    },
                  },
                  series: [{
                    data: [
                      { value: response.data[1].resolved, name: 'Resolved' },
                      { value: response.data[1].newTicketCount, name: 'New' },
                      { value: response.data[1].InProgressTicketCount, name: 'In Progress' },
                    ]
                  }]
                });
              }

              if (this.priorityPieInstance) {
                this.priorityPieInstance.setOption({
                  title: {
                    text: response.data[0].customerName,
                    subtext: 'Ticket Priority',
                    left: 'center',
                    textStyle: {
                      color: 'white',
                      fontSize: 14,
                      fontWeight: 'bold',
                    },
                    subtextStyle: {
                      color: 'white',
                      fontSize: 12,
                      fontWeight: 'normal',
                    },
                  },
                  series: [
                    {

                      data: [
                        { value: response.data[1].lowTicketCount, name: 'Low' },
                        { value: response.data[1].mediumTicketCount, name: 'Medium' },
                        { value: response.data[1].immediateTicketCount, name: 'Immediate' },
                        { value: response.data[1].highTicketCount, name: 'High' }
                      ],
                    }
                  ]
                })
              }
            }
          }, error(err) {
            console.log(err);
          },
        })

        this.dashboardService.getAllTicketCountStats().subscribe({
          next: response => {
            if (response.status === Constant.SUCCESS) {
              this.ticketCountMap = Object.keys(response.data[1]).map(key => ({ date: key, count: response.data[1][key] }));
              let date: any = [];
              let count: any = [];
              for (let i of this.ticketCountMap) {
                date.push(i.date);
                count.push(i.count);
              }
              this.cdr.detectChanges();
              if (this.graphInstance) {
                this.graphInstance.setOption({
                  tooltip: {
                    trigger: 'axis',
                    axisPointer: {
                      type: 'shadow'
                    }
                  },
                  grid: {
                    left: '3%',
                    right: '4%',
                    bottom: '3%',
                    containLabel: true
                  },
                  xAxis: [
                    {
                      type: 'category',
                      data: date,
                      axisTick: {
                        alignWithLabel: true
                      }
                    }
                  ],
                  yAxis: [
                    {
                      type: 'value'
                    }
                  ],
                  series: [
                    {
                      name: 'Ticket Status',
                      type: 'bar',
                      barWidth: '60%',
                      data: count
                    }
                  ]
                });
              }
            } else {
              this.toast.error(response.message);
            }
          }, error(err) {
            console.log(err);
          }
        })

      } else {
        this.dashboardService.getCustomerStats(event.id).subscribe({
          next: response => {
            if (response.status === Constant.SUCCESS) {
              this.stats = this.getData(response.data);
              // if (response.data[0].userType === "Admin") {
              //   this.isUserAdmin = true;
              // } else {
              //   this.isUserAdmin = false;
              // }
              this.cdr.detectChanges();
              if (this.pieInstance) {
                this.pieInstance.setOption({
                  title: {
                    text: response.data[0].customerName,
                    subtext: 'Ticket Status',
                    left: 'center',
                    textStyle: {
                      color: 'white',
                      fontSize: 14,
                      fontWeight: 'bold',
                    },
                    subtextStyle: {
                      color: 'white',
                      fontSize: 12,
                      fontWeight: 'normal',
                    },
                  },
                  series: [{
                    data: [
                      { value: response.data[1].resolved, name: 'Resolved' },
                      { value: response.data[1].newTicketCount, name: 'New' },
                      { value: response.data[1].InProgressTicketCount, name: 'In Progress' },
                    ]
                  }]
                });
              }

              if (this.priorityPieInstance) {
                this.priorityPieInstance.setOption({
                  title: {
                    text: response.data[0].customerName,
                    subtext: 'Ticket Priority',
                    left: 'center',
                    textStyle: {
                      color: 'white',
                      fontSize: 14,
                      fontWeight: 'bold',
                    },
                    subtextStyle: {
                      color: 'white',
                      fontSize: 12,
                      fontWeight: 'normal',
                    },
                  },
                  series: [
                    {

                      data: [
                        { value: response.data[1].lowTicketCount, name: 'Low' },
                        { value: response.data[1].mediumTicketCount, name: 'Medium' },
                        { value: response.data[1].immediateTicketCount, name: 'Immediate' },
                        { value: response.data[1].highTicketCount, name: 'High' }
                      ],
                    }
                  ]
                })
              }

            }
          }, error(err) {
            console.log(err);
          },
        })

        this.dashboardService.getCustomerTicketCountStats(event.id).subscribe({
          next: response => {
            if (response.status === Constant.SUCCESS) {
              this.ticketCountMap = Object.keys(response.data[1]).map(key => ({ date: key, count: response.data[1][key] }));
              let date: any = [];
              let count: any = [];
              for (let i of this.ticketCountMap) {
                date.push(i.date);
                count.push(i.count);
              }
              this.cdr.detectChanges();
              if (this.graphInstance) {
                this.graphInstance.setOption({
                  tooltip: {
                    trigger: 'axis',
                    axisPointer: {
                      type: 'shadow'
                    }
                  },
                  grid: {
                    left: '3%',
                    right: '4%',
                    bottom: '3%',
                    containLabel: true
                  },
                  xAxis: [
                    {
                      type: 'category',
                      data: date,
                      axisTick: {
                        alignWithLabel: true
                      }
                    }
                  ],
                  yAxis: [
                    {
                      type: 'value'
                    }
                  ],
                  series: [
                    {
                      name: 'Ticket Status',
                      type: 'bar',
                      barWidth: '60%',
                      data: count
                    }
                  ]
                });
              }
            } else {
              this.toast.error(response.message);
            }
          }, error(err) {
            console.log(err);
          }
        })
      }
    }
  }
}


